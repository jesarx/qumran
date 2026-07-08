package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

// Mutating queries, ported from lib/queries/*.ts and lib/db.ts.

// createSlug ports createSlug from lib/db.ts exactly: lowercase, trim,
// remove non-word chars (ASCII \w like in JS, so "Poesía" → "poesa"),
// spaces → hyphens, collapse hyphens.
func createSlug(text string) string {
	s := strings.ToLower(strings.TrimSpace(text))
	var b strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r == '_', r == '-', r == ' ':
			b.WriteRune(r)
		}
	}
	s = strings.Join(strings.Fields(b.String()), "-")
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	return s
}

// uniqueSlug appends -1, -2, ... until the slug is free in the given table.
func (db *DB) uniqueSlug(ctx context.Context, table, base string) (string, error) {
	slug := base
	for counter := 1; ; counter++ {
		var exists bool
		err := db.pool.QueryRow(ctx,
			fmt.Sprintf("SELECT EXISTS (SELECT 1 FROM %s WHERE slug = $1)", table),
			slug).Scan(&exists)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", base, counter)
	}
}

// ---- Authors ---------------------------------------------------------------

func (db *DB) GetAuthorByID(ctx context.Context, id int) (*Author, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id, first_name, last_name, slug, created_at, updated_at, 0 AS book_count
		FROM authors WHERE id = $1`, id)
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

func (db *DB) FindOrCreateAuthor(ctx context.Context, firstName, lastName string) (*Author, error) {
	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)

	var query string
	var args []any
	if firstName != "" {
		query = `SELECT id FROM authors WHERE LOWER(last_name) = LOWER($1) AND LOWER(first_name) = LOWER($2)`
		args = []any{lastName, firstName}
	} else {
		query = `SELECT id FROM authors WHERE LOWER(last_name) = LOWER($1) AND first_name IS NULL`
		args = []any{lastName}
	}
	var id int
	err := db.pool.QueryRow(ctx, query, args...).Scan(&id)
	if err == nil {
		return db.GetAuthorByID(ctx, id)
	}
	if err != pgx.ErrNoRows {
		return nil, err
	}

	// Crear: slug a partir del nombre completo, único
	fullName := lastName
	if firstName != "" {
		fullName = firstName + " " + lastName
	}
	slug, err := db.uniqueSlug(ctx, "authors", createSlug(fullName))
	if err != nil {
		return nil, err
	}
	var first any
	if firstName != "" {
		first = firstName
	}
	err = db.pool.QueryRow(ctx,
		`INSERT INTO authors (first_name, last_name, slug) VALUES ($1, $2, $3) RETURNING id`,
		first, lastName, slug).Scan(&id)
	if err != nil {
		return nil, err
	}
	return db.GetAuthorByID(ctx, id)
}

func (db *DB) UpdateAuthor(ctx context.Context, id int, firstName, lastName string) error {
	var first any
	if strings.TrimSpace(firstName) != "" {
		first = strings.TrimSpace(firstName)
	}
	tag, err := db.pool.Exec(ctx,
		`UPDATE authors SET first_name = $1, last_name = $2 WHERE id = $3`,
		first, strings.TrimSpace(lastName), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (db *DB) DeleteAuthor(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM authors WHERE id = $1`, id)
	return err
}

// ---- Publishers -------------------------------------------------------------

func (db *DB) GetPublisherByID(ctx context.Context, id int) (*Publisher, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id, name, slug, created_at, updated_at, 0 AS book_count
		FROM publishers WHERE id = $1`, id)
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

func (db *DB) FindOrCreatePublisher(ctx context.Context, name string) (*Publisher, error) {
	name = strings.TrimSpace(name)
	var id int
	err := db.pool.QueryRow(ctx,
		`SELECT id FROM publishers WHERE LOWER(name) = LOWER($1)`, name).Scan(&id)
	if err == nil {
		return db.GetPublisherByID(ctx, id)
	}
	if err != pgx.ErrNoRows {
		return nil, err
	}

	slug, err := db.uniqueSlug(ctx, "publishers", createSlug(name))
	if err != nil {
		return nil, err
	}
	err = db.pool.QueryRow(ctx,
		`INSERT INTO publishers (name, slug) VALUES ($1, $2) RETURNING id`,
		name, slug).Scan(&id)
	if err != nil {
		return nil, err
	}
	return db.GetPublisherByID(ctx, id)
}

func (db *DB) UpdatePublisher(ctx context.Context, id int, name string) error {
	tag, err := db.pool.Exec(ctx,
		`UPDATE publishers SET name = $1 WHERE id = $2`, strings.TrimSpace(name), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (db *DB) DeletePublisher(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM publishers WHERE id = $1`, id)
	return err
}

// ---- Locations --------------------------------------------------------------

func (db *DB) GetLocationByID(ctx context.Context, id int) (*Location, error) {
	rows, err := db.pool.Query(ctx, `
		SELECT id, name, slug, created_at, updated_at, 0 AS book_count
		FROM locations WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	l, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[Location])
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (db *DB) CreateLocation(ctx context.Context, name string) (*Location, error) {
	name = strings.TrimSpace(name)
	slug, err := db.uniqueSlug(ctx, "locations", createSlug(name))
	if err != nil {
		return nil, err
	}
	var id int
	err = db.pool.QueryRow(ctx,
		`INSERT INTO locations (name, slug) VALUES ($1, $2) RETURNING id`,
		name, slug).Scan(&id)
	if err != nil {
		return nil, err
	}
	return db.GetLocationByID(ctx, id)
}

func (db *DB) UpdateLocation(ctx context.Context, id int, name string) error {
	tag, err := db.pool.Exec(ctx,
		`UPDATE locations SET name = $1 WHERE id = $2`, strings.TrimSpace(name), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (db *DB) DeleteLocation(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM locations WHERE id = $1`, id)
	return err
}

// ---- Books ------------------------------------------------------------------

type BookInput struct {
	Title       string
	ISBN        string // ya normalizado (solo dígitos) o vacío
	Author1ID   int
	Author2ID   *int
	PublisherID int
	CategoryID  int
	LocationID  *int
	Scanned     string
}

func (db *DB) ISBNExists(ctx context.Context, isbn string, excludeID int) (bool, error) {
	isbn = onlyDigits(isbn)
	if isbn == "" {
		return false, nil
	}
	var exists bool
	err := db.pool.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM books WHERE isbn = $1 AND id <> $2)`,
		isbn, excludeID).Scan(&exists)
	return exists, err
}

func (db *DB) CreateBook(ctx context.Context, in BookInput) (int, error) {
	var isbn any
	if in.ISBN != "" {
		isbn = in.ISBN
	}
	if in.Scanned == "" {
		in.Scanned = "not_applicable"
	}
	var id int
	err := db.pool.QueryRow(ctx, `
		INSERT INTO books (title, isbn, author1_id, author2_id, publisher_id, category_id, location_id, scanned)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`,
		in.Title, isbn, in.Author1ID, in.Author2ID, in.PublisherID, in.CategoryID, in.LocationID, in.Scanned,
	).Scan(&id)
	return id, err
}

func (db *DB) UpdateBook(ctx context.Context, id int, in BookInput) error {
	var isbn any
	if in.ISBN != "" {
		isbn = in.ISBN
	}
	if in.Scanned == "" {
		in.Scanned = "not_applicable"
	}
	tag, err := db.pool.Exec(ctx, `
		UPDATE books
		SET title = $1, isbn = $2, author1_id = $3, author2_id = $4,
			publisher_id = $5, category_id = $6, location_id = $7, scanned = $8,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $9`,
		in.Title, isbn, in.Author1ID, in.Author2ID, in.PublisherID, in.CategoryID, in.LocationID, in.Scanned, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (db *DB) DeleteBook(ctx context.Context, id int) error {
	_, err := db.pool.Exec(ctx, `DELETE FROM books WHERE id = $1`, id)
	return err
}
