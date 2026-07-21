package main

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Queries ported from lib/queries/*.ts of the Next.js app. The SQL is kept
// intentionally identical (same DB functions, same semantics).

type DB struct {
	pool *pgxpool.Pool
}

// ---- Books --------------------------------------------------------------

type BookFilters struct {
	Search        string
	AuthorSlug    string
	PublisherSlug string
	CategorySlug  string
	LocationSlug  string
	Scanned       string // "", "pending", "done", "not_applicable"
	Sort          string // "", "title", "-title", "author", "-author", "created_at", "-created_at"
	Page          int
	Limit         int
}

type BookList struct {
	Books      []Book
	Total      int
	Page       int
	TotalPages int
}

const bookSelectColumns = `
	b.id, b.title, b.isbn, b.author1_id, b.author2_id, b.publisher_id,
	b.category_id, b.location_id, b.scanned, b.created_at, b.updated_at,
	a1.first_name AS author1_first_name,
	a1.last_name  AS author1_last_name,
	a1.slug       AS author1_slug,
	a2.first_name AS author2_first_name,
	a2.last_name  AS author2_last_name,
	a2.slug       AS author2_slug,
	p.name AS publisher_name,
	p.slug AS publisher_slug,
	c.name AS category_name,
	c.slug AS category_slug,
	l.name AS location_name,
	l.slug AS location_slug`

const bookJoins = `
	FROM books b
	LEFT JOIN authors a1 ON b.author1_id = a1.id
	LEFT JOIN authors a2 ON b.author2_id = a2.id
	LEFT JOIN publishers p ON b.publisher_id = p.id
	LEFT JOIN categories c ON b.category_id = c.id
	LEFT JOIN locations l ON b.location_id = l.id`

func onlyDigits(s string) string {
	var sb strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

func (db *DB) GetBooks(ctx context.Context, f BookFilters) (BookList, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	offset := (f.Page - 1) * f.Limit

	var conds []string
	var params []any

	if s := strings.TrimSpace(f.Search); s != "" {
		cleaned := onlyDigits(strings.ReplaceAll(strings.ReplaceAll(s, "-", ""), " ", ""))
		isbnLike := len(cleaned) >= 10 && len(cleaned) <= 13 && cleaned == onlyDigits(s)
		if isbnLike {
			params = append(params, cleaned)
			conds = append(conds, fmt.Sprintf("b.isbn = $%d", len(params)))
		} else {
			params = append(params, "%"+s+"%")
			n := len(params)
			conds = append(conds, fmt.Sprintf(`(
				LOWER(b.title) LIKE LOWER($%d) OR
				LOWER(a1.first_name || ' ' || a1.last_name) LIKE LOWER($%d) OR
				LOWER(a1.last_name) LIKE LOWER($%d) OR
				LOWER(a2.first_name || ' ' || a2.last_name) LIKE LOWER($%d) OR
				LOWER(a2.last_name) LIKE LOWER($%d)
			)`, n, n, n, n, n))
		}
	}
	if f.AuthorSlug != "" {
		params = append(params, f.AuthorSlug)
		conds = append(conds, fmt.Sprintf("(a1.slug = $%d OR a2.slug = $%d)", len(params), len(params)))
	}
	if f.PublisherSlug != "" {
		params = append(params, f.PublisherSlug)
		conds = append(conds, fmt.Sprintf("p.slug = $%d", len(params)))
	}
	if f.CategorySlug != "" {
		params = append(params, f.CategorySlug)
		conds = append(conds, fmt.Sprintf("c.slug = $%d", len(params)))
	}
	if f.LocationSlug != "" {
		params = append(params, f.LocationSlug)
		conds = append(conds, fmt.Sprintf("l.slug = $%d", len(params)))
	}
	if f.Scanned == "pending" || f.Scanned == "done" || f.Scanned == "not_applicable" {
		params = append(params, f.Scanned)
		conds = append(conds, fmt.Sprintf("b.scanned = $%d", len(params)))
	}

	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}

	// Default: most recent first, with id as a stable tie-breaker.
	orderBy := "b.created_at DESC, b.id DESC"
	switch f.Sort {
	case "author":
		orderBy = `get_author_sort_priority(a1.last_name) ASC,
			normalize_author_lastname_for_sorting(a1.last_name) ASC,
			a1.first_name ASC,
			normalize_title_for_sorting(b.title) ASC`
	case "-author":
		orderBy = `get_author_sort_priority(a1.last_name) DESC,
			normalize_author_lastname_for_sorting(a1.last_name) DESC,
			a1.first_name DESC,
			normalize_title_for_sorting(b.title) DESC`
	case "title":
		orderBy = "normalize_title_for_sorting(b.title) ASC"
	case "-title":
		orderBy = "normalize_title_for_sorting(b.title) DESC"
	case "created_at":
		orderBy = "b.created_at ASC, b.id ASC"
	case "-created_at":
		orderBy = "b.created_at DESC, b.id DESC"
	}

	var total int
	countSQL := "SELECT COUNT(DISTINCT b.id)" + bookJoins + " " + where
	if err := db.pool.QueryRow(ctx, countSQL, params...).Scan(&total); err != nil {
		return BookList{}, fmt.Errorf("count books: %w", err)
	}

	params = append(params, f.Limit, offset)
	listSQL := fmt.Sprintf("SELECT %s %s %s ORDER BY %s LIMIT $%d OFFSET $%d",
		bookSelectColumns, bookJoins, where, orderBy, len(params)-1, len(params))

	rows, err := db.pool.Query(ctx, listSQL, params...)
	if err != nil {
		return BookList{}, fmt.Errorf("list books: %w", err)
	}
	books, err := pgx.CollectRows(rows, pgx.RowToStructByName[Book])
	if err != nil {
		return BookList{}, fmt.Errorf("scan books: %w", err)
	}

	return BookList{
		Books:      books,
		Total:      total,
		Page:       f.Page,
		TotalPages: int(math.Ceil(float64(total) / float64(f.Limit))),
	}, nil
}

// bookColumnsBare are the output column names of bookSelectColumns once it
// runs inside a CTE (used to project neighbor rows without the extra rn col).
const bookColumnsBare = `id, title, isbn, author1_id, author2_id, publisher_id,
	category_id, location_id, scanned, created_at, updated_at,
	author1_first_name, author1_last_name, author1_slug,
	author2_first_name, author2_last_name, author2_slug,
	publisher_name, publisher_slug, category_name, category_slug,
	location_name, location_slug`

// physicalOrder is the shelf order: the same author-priority + normalized
// ordering the tables use by default, with id as a stable tie-breaker.
const physicalOrder = `get_author_sort_priority(a1.last_name) ASC,
	normalize_author_lastname_for_sorting(a1.last_name) ASC,
	a1.first_name ASC,
	normalize_title_for_sorting(b.title) ASC,
	b.id ASC`

// GetBookNeighbors returns the books shelved immediately before and after the
// given book — same location and same category — in physical (shelf) order.
// radius books on each side; the given book is included in the result.
func (db *DB) GetBookNeighbors(ctx context.Context, book *Book, radius int) ([]Book, error) {
	var params []any
	var locCond string
	if book.LocationID != nil {
		params = append(params, *book.LocationID)
		locCond = fmt.Sprintf("b.location_id = $%d", len(params))
	} else {
		locCond = "b.location_id IS NULL"
	}
	params = append(params, book.CategoryID)
	catParam := len(params)
	params = append(params, book.ID)
	idParam := len(params)

	sql := fmt.Sprintf(`
		WITH ordered AS (
			SELECT %s,
				ROW_NUMBER() OVER (ORDER BY %s) AS rn
			%s
			WHERE %s AND b.category_id = $%d
		),
		cur AS (SELECT rn FROM ordered WHERE id = $%d)
		SELECT %s
		FROM ordered o CROSS JOIN cur
		WHERE o.rn BETWEEN cur.rn - %d AND cur.rn + %d
		ORDER BY o.rn`,
		bookSelectColumns, physicalOrder, bookJoins, locCond, catParam,
		idParam, bookColumnsBare, radius, radius)

	rows, err := db.pool.Query(ctx, sql, params...)
	if err != nil {
		return nil, fmt.Errorf("book neighbors: %w", err)
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[Book])
}

func (db *DB) GetBookByID(ctx context.Context, id int) (*Book, error) {
	sql := "SELECT " + bookSelectColumns + bookJoins + " WHERE b.id = $1"
	rows, err := db.pool.Query(ctx, sql, id)
	if err != nil {
		return nil, err
	}
	book, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[Book])
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &book, nil
}

// ---- Authors ------------------------------------------------------------

type AuthorList struct {
	Authors    []Author
	Total      int
	Page       int
	TotalPages int
}

func (db *DB) GetAuthors(ctx context.Context, search, sort string, page, limit int) (AuthorList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	where := ""
	var params []any
	if s := strings.TrimSpace(search); s != "" {
		params = append(params, "%"+s+"%")
		where = `WHERE (LOWER(a.first_name) LIKE LOWER($1) OR LOWER(a.last_name) LIKE LOWER($1)
			OR LOWER(a.first_name || ' ' || a.last_name) LIKE LOWER($1))`
	}

	var total int
	countSQL := "SELECT COUNT(DISTINCT a.id) FROM authors a " + where
	if err := db.pool.QueryRow(ctx, countSQL, params...).Scan(&total); err != nil {
		return AuthorList{}, fmt.Errorf("count authors: %w", err)
	}

	orderBy := `get_author_sort_priority(a.last_name) ASC,
		normalize_author_lastname_for_sorting(a.last_name) ASC, a.first_name ASC`
	switch sort {
	case "-name":
		orderBy = `get_author_sort_priority(a.last_name) DESC,
			normalize_author_lastname_for_sorting(a.last_name) DESC, a.first_name DESC`
	case "book_count":
		orderBy = "book_count ASC, normalize_author_lastname_for_sorting(a.last_name) ASC"
	case "-book_count":
		orderBy = "book_count DESC, normalize_author_lastname_for_sorting(a.last_name) ASC"
	}

	params = append(params, limit, offset)
	sql := fmt.Sprintf(`
		SELECT a.id, a.first_name, a.last_name, a.slug, a.created_at, a.updated_at,
			COUNT(DISTINCT b.id) AS book_count
		FROM authors a
		LEFT JOIN books b ON a.id = b.author1_id OR a.id = b.author2_id
		%s
		GROUP BY a.id
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, where, orderBy, len(params)-1, len(params))

	rows, err := db.pool.Query(ctx, sql, params...)
	if err != nil {
		return AuthorList{}, fmt.Errorf("list authors: %w", err)
	}
	authors, err := pgx.CollectRows(rows, pgx.RowToStructByName[Author])
	if err != nil {
		return AuthorList{}, fmt.Errorf("scan authors: %w", err)
	}

	return AuthorList{
		Authors:    authors,
		Total:      total,
		Page:       page,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

// ---- Publishers ---------------------------------------------------------

type PublisherList struct {
	Publishers []Publisher
	Total      int
	Page       int
	TotalPages int
}

func (db *DB) GetPublishers(ctx context.Context, search, sort string, page, limit int) (PublisherList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	where := ""
	var params []any
	if s := strings.TrimSpace(search); s != "" {
		params = append(params, "%"+s+"%")
		where = "WHERE LOWER(p.name) LIKE LOWER($1)"
	}

	var total int
	if err := db.pool.QueryRow(ctx, "SELECT COUNT(*) FROM publishers p "+where, params...).Scan(&total); err != nil {
		return PublisherList{}, fmt.Errorf("count publishers: %w", err)
	}

	orderBy := "p.name ASC"
	switch sort {
	case "-name":
		orderBy = "p.name DESC"
	case "book_count":
		orderBy = "book_count ASC, p.name ASC"
	case "-book_count":
		orderBy = "book_count DESC, p.name ASC"
	}

	params = append(params, limit, offset)
	sql := fmt.Sprintf(`
		SELECT p.id, p.name, p.slug, p.created_at, p.updated_at,
			COUNT(b.id) AS book_count
		FROM publishers p
		LEFT JOIN books b ON p.id = b.publisher_id
		%s
		GROUP BY p.id
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, where, orderBy, len(params)-1, len(params))

	rows, err := db.pool.Query(ctx, sql, params...)
	if err != nil {
		return PublisherList{}, fmt.Errorf("list publishers: %w", err)
	}
	pubs, err := pgx.CollectRows(rows, pgx.RowToStructByName[Publisher])
	if err != nil {
		return PublisherList{}, fmt.Errorf("scan publishers: %w", err)
	}

	return PublisherList{
		Publishers: pubs,
		Total:      total,
		Page:       page,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

// ---- Categories & Locations ----------------------------------------------

func nameCountOrder(sort, nameCol string) string {
	switch sort {
	case "-name":
		return nameCol + " DESC"
	case "book_count":
		return "book_count ASC, " + nameCol + " ASC"
	case "-book_count":
		return "book_count DESC, " + nameCol + " ASC"
	default:
		return nameCol + " ASC"
	}
}

func (db *DB) GetCategories(ctx context.Context, search, sort string) ([]Category, error) {
	where := ""
	var params []any
	if s := strings.TrimSpace(search); s != "" {
		params = append(params, "%"+s+"%")
		where = "WHERE LOWER(c.name) LIKE LOWER($1)"
	}
	rows, err := db.pool.Query(ctx, fmt.Sprintf(`
		SELECT c.id, c.name, c.slug, c.created_at, c.updated_at,
			COUNT(b.id) AS book_count
		FROM categories c
		LEFT JOIN books b ON c.id = b.category_id
		%s
		GROUP BY c.id
		ORDER BY %s`, where, nameCountOrder(sort, "c.name")), params...)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[Category])
}

func (db *DB) GetLocations(ctx context.Context, search, sort string) ([]Location, error) {
	where := ""
	var params []any
	if s := strings.TrimSpace(search); s != "" {
		params = append(params, "%"+s+"%")
		where = "WHERE LOWER(l.name) LIKE LOWER($1)"
	}
	rows, err := db.pool.Query(ctx, fmt.Sprintf(`
		SELECT l.id, l.name, l.slug, l.created_at, l.updated_at,
			COUNT(b.id) AS book_count
		FROM locations l
		LEFT JOIN books b ON l.id = b.location_id
		%s
		GROUP BY l.id
		ORDER BY %s`, where, nameCountOrder(sort, "l.name")), params...)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByName[Location])
}

// Lookups used for the "Mostrando libros de X" filter chips.

func (db *DB) GetAuthorBySlug(ctx context.Context, slug string) (*Author, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id, first_name, last_name, slug, created_at, updated_at,
			0 AS book_count
		FROM authors WHERE slug = $1`, slug)
	if err != nil {
		return nil, err
	}
	a, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[Author])
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (db *DB) GetPublisherBySlug(ctx context.Context, slug string) (*Publisher, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id, name, slug, created_at, updated_at, 0 AS book_count
		FROM publishers WHERE slug = $1`, slug)
	if err != nil {
		return nil, err
	}
	p, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[Publisher])
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
