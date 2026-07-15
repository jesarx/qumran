package main

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
)

// ---- Libros: listado ---------------------------------------------------------

// Los listados de administración se unificaron con los públicos (las tablas
// muestran las acciones de edición cuando hay sesión); las rutas viejas
// redirigen conservando los query params.
func redirectTo(base string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dest := base
		if q := r.URL.RawQuery; q != "" {
			dest += "?" + q
		}
		http.Redirect(w, r, dest, http.StatusSeeOther)
	}
}

// ---- Libros: formulario nuevo/editar ------------------------------------------

type BookFormPage struct {
	IsEdit bool
	BookID int
	Error  string

	Title, ISBN                string
	Author1First, Author1Last  string
	Author2First, Author2Last  string
	PublisherName              string
	CategoryID, LocationID     string
	Scanned                    string

	Categories []Category
	Locations  []Location
	Authors    []Author    // para el datalist de apellidos
	Publishers []Publisher // para el datalist de editoriales
}

func (app *application) loadBookFormOptions(r *http.Request, form *BookFormPage) error {
	ctx := r.Context()
	var err error
	if form.Categories, err = app.db.GetCategories(ctx, "", ""); err != nil {
		return err
	}
	if form.Locations, err = app.db.GetLocations(ctx, "", ""); err != nil {
		return err
	}
	authors, err := app.db.GetAuthors(ctx, "", "", 1, 5000)
	if err != nil {
		return err
	}
	form.Authors = authors.Authors
	publishers, err := app.db.GetPublishers(ctx, "", "", 1, 5000)
	if err != nil {
		return err
	}
	form.Publishers = publishers.Publishers
	return nil
}

func (app *application) bookNewFormHandler(w http.ResponseWriter, r *http.Request) {
	form := BookFormPage{Scanned: "not_applicable"}
	if err := app.loadBookFormOptions(r, &form); err != nil {
		app.serverError(w, r, err)
		return
	}
	// Ubicación por defecto: "Casa" si existe; si no, la primera.
	for _, l := range form.Locations {
		if strings.EqualFold(strings.TrimSpace(l.Name), "casa") {
			form.LocationID = strconv.Itoa(l.ID)
			break
		}
	}
	if form.LocationID == "" && len(form.Locations) > 0 {
		form.LocationID = strconv.Itoa(form.Locations[0].ID)
	}
	app.render(w, r, http.StatusOK, "book_form", templateData{BookForm: &form})
}

// readBookForm parses and validates the shared book form. Returns the form
// (with values preserved) and an error message when invalid.
func readBookForm(r *http.Request) (BookFormPage, string) {
	f := BookFormPage{
		Title:         strings.TrimSpace(r.PostFormValue("title")),
		ISBN:          onlyDigits(r.PostFormValue("isbn")),
		Author1First:  strings.TrimSpace(r.PostFormValue("author1FirstName")),
		Author1Last:   strings.TrimSpace(r.PostFormValue("author1LastName")),
		Author2First:  strings.TrimSpace(r.PostFormValue("author2FirstName")),
		Author2Last:   strings.TrimSpace(r.PostFormValue("author2LastName")),
		PublisherName: strings.TrimSpace(r.PostFormValue("publisherName")),
		CategoryID:    r.PostFormValue("categoryId"),
		LocationID:    r.PostFormValue("locationId"),
		Scanned:       r.PostFormValue("scanned"),
	}
	switch {
	case f.Title == "":
		return f, "El título es requerido"
	case f.Author1Last == "":
		return f, "El apellido del autor principal es requerido"
	case f.PublisherName == "":
		return f, "La editorial es requerida"
	}
	if n, err := strconv.Atoi(f.CategoryID); err != nil || n < 1 {
		return f, "La categoría es requerida"
	}
	if n, err := strconv.Atoi(f.LocationID); err != nil || n < 1 {
		return f, "La ubicación es requerida"
	}
	if f.ISBN != "" && len(f.ISBN) != 10 && len(f.ISBN) != 13 {
		return f, "El ISBN debe tener 10 o 13 dígitos"
	}
	if f.Scanned != "pending" && f.Scanned != "done" && f.Scanned != "not_applicable" {
		f.Scanned = "not_applicable"
	}
	return f, ""
}

// saveBook does the find-or-create + insert/update shared by create and edit.
func (app *application) saveBook(r *http.Request, f *BookFormPage, bookID int) (string, error) {
	ctx := r.Context()

	if f.ISBN != "" {
		exists, err := app.db.ISBNExists(ctx, f.ISBN, bookID)
		if err != nil {
			return "", err
		}
		if exists {
			return "Ya existe un libro con este ISBN en la base de datos", nil
		}
	}

	author1, err := app.db.FindOrCreateAuthor(ctx, f.Author1First, f.Author1Last)
	if err != nil {
		return "", err
	}
	var author2ID *int
	if f.Author2Last != "" {
		author2, err := app.db.FindOrCreateAuthor(ctx, f.Author2First, f.Author2Last)
		if err != nil {
			return "", err
		}
		author2ID = &author2.ID
	}
	publisher, err := app.db.FindOrCreatePublisher(ctx, f.PublisherName)
	if err != nil {
		return "", err
	}

	categoryID, _ := strconv.Atoi(f.CategoryID)
	locationID, _ := strconv.Atoi(f.LocationID)
	in := BookInput{
		Title:       f.Title,
		ISBN:        f.ISBN,
		Author1ID:   author1.ID,
		Author2ID:   author2ID,
		PublisherID: publisher.ID,
		CategoryID:  categoryID,
		LocationID:  &locationID,
		Scanned:     f.Scanned,
	}

	if bookID == 0 {
		_, err = app.db.CreateBook(ctx, in)
	} else {
		err = app.db.UpdateBook(ctx, bookID, in)
	}
	if isUniqueViolation(err) {
		return "Ya existe un libro con este ISBN en la base de datos", nil
	}
	return "", err
}

func (app *application) bookCreateHandler(w http.ResponseWriter, r *http.Request) {
	form, errMsg := readBookForm(r)
	if errMsg == "" {
		var err error
		errMsg, err = app.saveBook(r, &form, 0)
		if err != nil {
			app.serverError(w, r, err)
			return
		}
	}
	if errMsg != "" {
		form.Error = errMsg
		if err := app.loadBookFormOptions(r, &form); err != nil {
			app.serverError(w, r, err)
			return
		}
		app.render(w, r, http.StatusUnprocessableEntity, "book_form", templateData{BookForm: &form})
		return
	}
	app.sessions.Put(r.Context(), "flash", "Libro agregado")
	http.Redirect(w, r, "/books", http.StatusSeeOther)
}

func (app *application) bookEditFormHandler(w http.ResponseWriter, r *http.Request) {
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
	form := BookFormPage{
		IsEdit:        true,
		BookID:        book.ID,
		Title:         book.Title,
		ISBN:          deref(book.ISBN),
		Author1First:  deref(book.Author1FirstName),
		Author1Last:   deref(book.Author1LastName),
		Author2First:  deref(book.Author2FirstName),
		Author2Last:   deref(book.Author2LastName),
		PublisherName: deref(book.PublisherName),
		CategoryID:    strconv.Itoa(book.CategoryID),
		Scanned:       book.Scanned,
	}
	if book.LocationID != nil {
		form.LocationID = strconv.Itoa(*book.LocationID)
	}
	if err := app.loadBookFormOptions(r, &form); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.render(w, r, http.StatusOK, "book_form", templateData{BookForm: &form})
}

func (app *application) bookUpdateHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	form, errMsg := readBookForm(r)
	form.IsEdit = true
	form.BookID = id
	if errMsg == "" {
		errMsg, err = app.saveBook(r, &form, id)
		if err != nil {
			app.serverError(w, r, err)
			return
		}
	}
	if errMsg != "" {
		form.Error = errMsg
		if err := app.loadBookFormOptions(r, &form); err != nil {
			app.serverError(w, r, err)
			return
		}
		app.render(w, r, http.StatusUnprocessableEntity, "book_form", templateData{BookForm: &form})
		return
	}
	app.sessions.Put(r.Context(), "flash", "Libro actualizado")
	http.Redirect(w, r, "/books", http.StatusSeeOther)
}

func (app *application) bookDeleteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	if err := app.db.DeleteBook(r.Context(), id); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Libro eliminado")
	http.Redirect(w, r, "/books", http.StatusSeeOther)
}

// ---- Autores / Editoriales / Ubicaciones: listados admin ----------------------




// ---- Formularios de entidades simples ------------------------------------------

type EntityFormPage struct {
	Kind   string // "author" | "publisher" | "location"
	IsEdit bool
	ID     int
	Error  string

	FirstName, LastName string // author
	Name                string // publisher / location
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func isFKViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

// -- Autores

func (app *application) authorEditFormHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	author, err := app.db.GetAuthorByID(r.Context(), id)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	if author == nil {
		app.notFound(w, r)
		return
	}
	app.render(w, r, http.StatusOK, "entity_form", templateData{EntityForm: &EntityFormPage{
		Kind: "author", IsEdit: true, ID: id,
		FirstName: deref(author.FirstName), LastName: author.LastName,
	}})
}

func (app *application) authorUpdateHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	firstName := strings.TrimSpace(r.PostFormValue("firstName"))
	lastName := strings.TrimSpace(r.PostFormValue("lastName"))
	if lastName == "" {
		app.render(w, r, http.StatusUnprocessableEntity, "entity_form", templateData{EntityForm: &EntityFormPage{
			Kind: "author", IsEdit: true, ID: id,
			FirstName: firstName, LastName: lastName,
			Error: "El apellido es requerido",
		}})
		return
	}
	if err := app.db.UpdateAuthor(r.Context(), id, firstName, lastName); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Autor actualizado")
	http.Redirect(w, r, "/authors", http.StatusSeeOther)
}

func (app *application) authorDeleteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	if err := app.db.DeleteAuthor(r.Context(), id); err != nil {
		if isFKViolation(err) {
			app.sessions.Put(r.Context(), "flash", "No se puede eliminar: el autor tiene libros asociados")
			http.Redirect(w, r, "/authors", http.StatusSeeOther)
			return
		}
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Autor eliminado")
	http.Redirect(w, r, "/authors", http.StatusSeeOther)
}

// -- Editoriales

func (app *application) publisherEditFormHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	publisher, err := app.db.GetPublisherByID(r.Context(), id)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	if publisher == nil {
		app.notFound(w, r)
		return
	}
	app.render(w, r, http.StatusOK, "entity_form", templateData{EntityForm: &EntityFormPage{
		Kind: "publisher", IsEdit: true, ID: id, Name: publisher.Name,
	}})
}

func (app *application) publisherUpdateHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	name := strings.TrimSpace(r.PostFormValue("name"))
	if name == "" {
		app.render(w, r, http.StatusUnprocessableEntity, "entity_form", templateData{EntityForm: &EntityFormPage{
			Kind: "publisher", IsEdit: true, ID: id, Name: name,
			Error: "El nombre es requerido",
		}})
		return
	}
	if err := app.db.UpdatePublisher(r.Context(), id, name); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Editorial actualizada")
	http.Redirect(w, r, "/publishers", http.StatusSeeOther)
}

func (app *application) publisherDeleteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	if err := app.db.DeletePublisher(r.Context(), id); err != nil {
		if isFKViolation(err) {
			app.sessions.Put(r.Context(), "flash", "No se puede eliminar: la editorial tiene libros asociados")
			http.Redirect(w, r, "/publishers", http.StatusSeeOther)
			return
		}
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Editorial eliminada")
	http.Redirect(w, r, "/publishers", http.StatusSeeOther)
}

// -- Ubicaciones

func (app *application) locationNewFormHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusOK, "entity_form", templateData{EntityForm: &EntityFormPage{Kind: "location"}})
}

func (app *application) locationCreateHandler(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimSpace(r.PostFormValue("name"))
	if name == "" {
		app.render(w, r, http.StatusUnprocessableEntity, "entity_form", templateData{EntityForm: &EntityFormPage{
			Kind: "location", Name: name, Error: "El nombre es requerido",
		}})
		return
	}
	if _, err := app.db.CreateLocation(r.Context(), name); err != nil {
		if isUniqueViolation(err) {
			app.render(w, r, http.StatusUnprocessableEntity, "entity_form", templateData{EntityForm: &EntityFormPage{
				Kind: "location", Name: name, Error: "Ya existe una ubicación con ese nombre",
			}})
			return
		}
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Ubicación agregada")
	http.Redirect(w, r, "/locations", http.StatusSeeOther)
}

func (app *application) locationEditFormHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	location, err := app.db.GetLocationByID(r.Context(), id)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	if location == nil {
		app.notFound(w, r)
		return
	}
	app.render(w, r, http.StatusOK, "entity_form", templateData{EntityForm: &EntityFormPage{
		Kind: "location", IsEdit: true, ID: id, Name: location.Name,
	}})
}

func (app *application) locationUpdateHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	name := strings.TrimSpace(r.PostFormValue("name"))
	if name == "" {
		app.render(w, r, http.StatusUnprocessableEntity, "entity_form", templateData{EntityForm: &EntityFormPage{
			Kind: "location", IsEdit: true, ID: id, Name: name,
			Error: "El nombre es requerido",
		}})
		return
	}
	if err := app.db.UpdateLocation(r.Context(), id, name); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Ubicación actualizada")
	http.Redirect(w, r, "/locations", http.StatusSeeOther)
}

func (app *application) locationDeleteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.notFound(w, r)
		return
	}
	if err := app.db.DeleteLocation(r.Context(), id); err != nil {
		if isFKViolation(err) {
			app.sessions.Put(r.Context(), "flash", "No se puede eliminar: la ubicación tiene libros asociados")
			http.Redirect(w, r, "/locations", http.StatusSeeOther)
			return
		}
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "flash", "Ubicación eliminada")
	http.Redirect(w, r, "/locations", http.StatusSeeOther)
}
