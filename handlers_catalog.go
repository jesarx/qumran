package main

import (
	"net/http"
	"net/url"
	"strconv"
)

// ---- Shared view helpers --------------------------------------------------

// Chip is an active-filter badge with a URL that removes it.
type Chip struct {
	Label     string
	RemoveURL string
	IsMain    bool // author/publisher chips get the prominent style
}

// PageLink is one entry of the pagination control.
type PageLink struct {
	Num      int
	URL      string
	Active   bool
	Ellipsis bool
}

type PaginationData struct {
	Links    []PageLink
	PrevURL  string
	NextURL  string
	HasPrev  bool
	HasNext  bool
	Showing  int
	Total    int
	Object   string
}

func withParam(q url.Values, key, value string) string {
	c := url.Values{}
	for k, vs := range q {
		for _, v := range vs {
			c.Add(k, v)
		}
	}
	if value == "" {
		c.Del(key)
	} else {
		c.Set(key, value)
	}
	if enc := c.Encode(); enc != "" {
		return "?" + enc
	}
	return "?"
}

func buildPagination(q url.Values, current, last, showing, total int, object string) *PaginationData {
	if last <= 1 {
		return nil
	}
	p := &PaginationData{Showing: showing, Total: total, Object: object}

	pageURL := func(n int) string { return withParam(q, "page", strconv.Itoa(n)) }

	// Same windowing as components/pagination.tsx: first, current±1, last.
	var nums []int
	nums = append(nums, 1)
	lo, hi := current-1, current+1
	if lo < 2 {
		lo = 2
	}
	if hi > last-1 {
		hi = last - 1
	}
	if lo > 2 {
		nums = append(nums, -1) // ellipsis
	}
	for i := lo; i <= hi; i++ {
		nums = append(nums, i)
	}
	if hi < last-1 {
		nums = append(nums, -1)
	}
	nums = append(nums, last)

	for _, n := range nums {
		if n == -1 {
			p.Links = append(p.Links, PageLink{Ellipsis: true})
			continue
		}
		p.Links = append(p.Links, PageLink{Num: n, URL: pageURL(n), Active: n == current})
	}
	if current > 1 {
		p.HasPrev = true
		p.PrevURL = pageURL(current - 1)
	}
	if current < last {
		p.HasNext = true
		p.NextURL = pageURL(current + 1)
	}
	return p
}

func queryInt(q url.Values, key string, fallback int) int {
	if n, err := strconv.Atoi(q.Get(key)); err == nil && n > 0 {
		return n
	}
	return fallback
}

// ---- /books ---------------------------------------------------------------

var scannedLabels = map[string]string{
	"done":           "Escaneado",
	"pending":        "Pendiente",
	"not_applicable": "No aplica",
}

type BooksPageData struct {
	List        BookList
	Categories  []Category
	Locations   []Location
	Search      string
	CategorySlug string
	LocationSlug string
	Scanned     string
	Sort        string
	Chips       []Chip
	MainChip    *Chip
	HasFilters  bool
	BasePath    string // "/books" o "/dashboard/books"
	ShowActions bool
	Pagination  *PaginationData
}

func (app *application) buildBooksPage(r *http.Request, basePath string, showActions bool) (*BooksPageData, error) {
	ctx := r.Context()
	q := r.URL.Query()

	filters := BookFilters{
		Search:        q.Get("search"),
		AuthorSlug:    q.Get("authorSlug"),
		PublisherSlug: q.Get("publisherSlug"),
		CategorySlug:  q.Get("categorySlug"),
		LocationSlug:  q.Get("locationSlug"),
		Scanned:       q.Get("scanned"),
		Sort:          q.Get("sort"),
		Page:          queryInt(q, "page", 1),
		Limit:         20,
	}

	list, err := app.db.GetBooks(ctx, filters)
	if err != nil {
		return nil, err
	}
	categories, err := app.db.GetCategories(ctx, "", "")
	if err != nil {
		return nil, err
	}
	locations, err := app.db.GetLocations(ctx, "", "")
	if err != nil {
		return nil, err
	}

	data := &BooksPageData{
		List:         list,
		Categories:   categories,
		Locations:    locations,
		Search:       filters.Search,
		CategorySlug: filters.CategorySlug,
		LocationSlug: filters.LocationSlug,
		Scanned:      filters.Scanned,
		Sort:         filters.Sort,
		BasePath:     basePath,
		ShowActions:  showActions,
	}

	// Chips de filtros activos (mismo comportamiento que book-filters.tsx)
	if filters.Search != "" {
		data.Chips = append(data.Chips, Chip{
			Label:     `Búsqueda: "` + filters.Search + `"`,
			RemoveURL: basePath + withParam(q, "search", ""),
		})
	}
	if filters.CategorySlug != "" {
		for _, c := range categories {
			if c.Slug == filters.CategorySlug {
				data.Chips = append(data.Chips, Chip{
					Label:     "Categoría: " + c.Name,
					RemoveURL: basePath + withParam(q, "categorySlug", ""),
				})
				break
			}
		}
	}
	if filters.LocationSlug != "" {
		for _, l := range locations {
			if l.Slug == filters.LocationSlug {
				data.Chips = append(data.Chips, Chip{
					Label:     "Ubicación: " + l.Name,
					RemoveURL: basePath + withParam(q, "locationSlug", ""),
				})
				break
			}
		}
	}
	if filters.Scanned != "" {
		if label, ok := scannedLabels[filters.Scanned]; ok {
			data.Chips = append(data.Chips, Chip{
				Label:     "Escaneado: " + label,
				RemoveURL: basePath + withParam(q, "scanned", ""),
			})
		}
	}
	if filters.AuthorSlug != "" {
		label := "Filtrado por autor"
		if a, err := app.db.GetAuthorBySlug(ctx, filters.AuthorSlug); err == nil && a != nil {
			name := a.LastName
			if a.FirstName != nil && *a.FirstName != "" {
				name = *a.FirstName + " " + a.LastName
			}
			label = "Mostrando libros de " + name
		}
		data.MainChip = &Chip{
			Label:     label,
			RemoveURL: basePath + withParam(q, "authorSlug", ""),
			IsMain:    true,
		}
	}
	if filters.PublisherSlug != "" && data.MainChip == nil {
		label := "Filtrado por editorial"
		if p, err := app.db.GetPublisherBySlug(ctx, filters.PublisherSlug); err == nil && p != nil {
			label = "Mostrando libros de " + p.Name
		}
		data.MainChip = &Chip{
			Label:     label,
			RemoveURL: basePath + withParam(q, "publisherSlug", ""),
			IsMain:    true,
		}
	}

	data.HasFilters = len(data.Chips) > 0 || data.MainChip != nil || filters.Sort != ""
	data.Pagination = buildPagination(q, list.Page, list.TotalPages, len(list.Books), list.Total, "libros")
	return data, nil
}

func (app *application) booksHandler(w http.ResponseWriter, r *http.Request) {
	data, err := app.buildBooksPage(r, "/books", app.isAuthenticated(r))
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	app.render(w, r, http.StatusOK, "books", templateData{Books: data})
}

func (app *application) bookDetailHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	book, err := app.db.GetBookByID(r.Context(), id)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	if book == nil {
		app.notFound(w, r)
		return
	}
	neighbors, err := app.db.GetBookNeighbors(r.Context(), book, 3)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	app.render(w, r, http.StatusOK, "book_detail", templateData{
		BookDetail: &BookDetailPage{Book: book, Neighbors: neighbors},
	})
}

// BookDetailPage is the individual book page plus its shelf neighbors.
type BookDetailPage struct {
	Book      *Book
	Neighbors []Book
}

// ---- Autores / Editoriales / Categorías / Ubicaciones ----------------------

type SimpleListPageData struct {
	Authors     []Author
	Publishers  []Publisher
	Categories  []Category
	Locations   []Location
	Total       int
	Search      string
	Sort        string
	HasFilters  bool
	ShowActions bool
	Pagination  *PaginationData
}

func (app *application) authorsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	name, sort := q.Get("name"), q.Get("sort")
	page := queryInt(q, "page", 1)

	list, err := app.db.GetAuthors(r.Context(), name, sort, page, 20)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	data := &SimpleListPageData{
		Authors: list.Authors, Total: list.Total,
		Search: name, Sort: sort,
		HasFilters:  name != "" || sort != "",
		ShowActions: app.isAuthenticated(r),
		Pagination:  buildPagination(q, list.Page, list.TotalPages, len(list.Authors), list.Total, "autores"),
	}
	app.render(w, r, http.StatusOK, "authors", templateData{SimpleList: data})
}

func (app *application) publishersHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	name, sort := q.Get("name"), q.Get("sort")
	page := queryInt(q, "page", 1)

	list, err := app.db.GetPublishers(r.Context(), name, sort, page, 20)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	data := &SimpleListPageData{
		Publishers: list.Publishers, Total: list.Total,
		Search: name, Sort: sort,
		HasFilters:  name != "" || sort != "",
		ShowActions: app.isAuthenticated(r),
		Pagination:  buildPagination(q, list.Page, list.TotalPages, len(list.Publishers), list.Total, "editoriales"),
	}
	app.render(w, r, http.StatusOK, "publishers", templateData{SimpleList: data})
}

func (app *application) tagsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	name, sort := q.Get("name"), q.Get("sort")

	categories, err := app.db.GetCategories(r.Context(), name, sort)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	data := &SimpleListPageData{
		Categories: categories, Total: len(categories),
		Search: name, Sort: sort,
		HasFilters: name != "" || sort != "",
	}
	app.render(w, r, http.StatusOK, "tags", templateData{SimpleList: data})
}

func (app *application) locationsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	name, sort := q.Get("name"), q.Get("sort")

	locations, err := app.db.GetLocations(r.Context(), name, sort)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	data := &SimpleListPageData{
		Locations: locations, Total: len(locations),
		Search: name, Sort: sort,
		HasFilters:  name != "" || sort != "",
		ShowActions: app.isAuthenticated(r),
	}
	app.render(w, r, http.StatusOK, "locations", templateData{SimpleList: data})
}

func (app *application) aboutHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusOK, "about", templateData{})
}

func (app *application) notFound(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusNotFound, "notfound", templateData{})
}
