package main

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/justinas/nosurf"
)

//go:embed templates
var templatesFS embed.FS

//go:embed static
var staticFS embed.FS

// icon renders a lucide SVG by name with the given classes.
func icon(name, class string) template.HTML {
	inner, ok := lucideIcons[name]
	if !ok {
		return template.HTML("<!-- icon not found: " + template.HTMLEscapeString(name) + " -->")
	}
	return template.HTML(fmt.Sprintf(
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s" aria-hidden="true">%s</svg>`,
		template.HTMLEscapeString(class), inner))
}

// compactDate renders dates like books-table.tsx: Hoy, Ayer, Nd, DD/MM, DD/MM/YY.
func compactDate(t time.Time) string {
	now := time.Now()
	days := int(now.Sub(t).Hours() / 24)
	switch {
	case days == 0:
		return "Hoy"
	case days == 1:
		return "Ayer"
	case days <= 7:
		return fmt.Sprintf("%dd", days)
	case t.Year() == now.Year():
		return t.Format("02/01")
	default:
		return t.Format("02/01/06")
	}
}

// longDate renders "2 de enero de 2006" for the detail page.
func longDate(t time.Time) string {
	months := []string{"enero", "febrero", "marzo", "abril", "mayo", "junio",
		"julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"}
	return fmt.Sprintf("%d de %s de %d", t.Day(), months[t.Month()-1], t.Year())
}

// truncate cuts a string to at most n runes, appending an ellipsis.
func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return strings.TrimSpace(string(r[:n-1])) + "\u2026"
}

var templateFuncs = template.FuncMap{
	"icon":        icon,
	"truncate":    truncate,
	"add":         func(a, b int) int { return a + b },
	"sub":         func(a, b int) int { return a - b },
	"compactDate": compactDate,
	"longDate":    longDate,
	"deref":       deref,
	// dict builds a map for passing several values to a sub-template.
	"dict": func(pairs ...any) (map[string]any, error) {
		if len(pairs)%2 != 0 {
			return nil, fmt.Errorf("dict: número impar de argumentos")
		}
		m := make(map[string]any, len(pairs)/2)
		for i := 0; i < len(pairs); i += 2 {
			key, ok := pairs[i].(string)
			if !ok {
				return nil, fmt.Errorf("dict: la llave %v no es string", pairs[i])
			}
			m[key] = pairs[i+1]
		}
		return m, nil
	},
}

// newTemplateCache parses base.tmpl + partials with every page template.
func newTemplateCache() (map[string]*template.Template, error) {
	cache := map[string]*template.Template{}

	pages, err := fs.Glob(templatesFS, "templates/pages/*.tmpl")
	if err != nil {
		return nil, err
	}
	for _, page := range pages {
		name := strings.TrimSuffix(strings.TrimPrefix(page, "templates/pages/"), ".tmpl")
		ts, err := template.New(name).Funcs(templateFuncs).ParseFS(templatesFS,
			"templates/base.tmpl", "templates/partials/*.tmpl", page)
		if err != nil {
			return nil, fmt.Errorf("parse %s: %w", page, err)
		}
		cache[name] = ts
	}
	return cache, nil
}

// templateData carries everything templates can need. Page-specific payloads
// hang off their own field; base fields are always set by render().
type templateData struct {
	IsAuthenticated bool
	CurrentPath     string
	CSRFToken       string
	Flash           string
	AssetVersion    string

	Error      *ErrorPageData
	Home       *HomeData
	Books      *BooksPageData
	BookDetail *BookDetailPage
	SimpleList *SimpleListPageData
	Login      *LoginPageData
	BookForm   *BookFormPage
	EntityForm *EntityFormPage
}

func (app *application) render(w http.ResponseWriter, r *http.Request, status int, page string, data templateData) {
	ts, ok := app.templates[page]
	if !ok {
		app.serverError(w, r, fmt.Errorf("template %q not found", page))
		return
	}

	data.CurrentPath = r.URL.Path
	data.IsAuthenticated = app.isAuthenticated(r)
	data.CSRFToken = nosurf.Token(r)
	data.Flash = app.sessions.PopString(r.Context(), "flash")
	data.AssetVersion = app.assetVersion

	buf := new(bytes.Buffer)
	if err := ts.ExecuteTemplate(buf, "base", data); err != nil {
		app.serverError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	buf.WriteTo(w)
}

type ErrorPageData struct {
	Code   int
	Title  string
	Detail string
}

// renderErrorPage draws the styled error page directly (never through
// render(), so a failing template can't recurse back here).
func (app *application) renderErrorPage(w http.ResponseWriter, r *http.Request, data ErrorPageData) {
	ts, ok := app.templates["error"]
	if !ok {
		http.Error(w, data.Title, data.Code)
		return
	}
	td := templateData{
		Error:           &data,
		CurrentPath:     r.URL.Path,
		IsAuthenticated: app.isAuthenticatedSafe(r),
		AssetVersion:    app.assetVersion,
	}
	buf := new(bytes.Buffer)
	if err := ts.ExecuteTemplate(buf, "base", td); err != nil {
		slog.Error("error page render failed", "err", err)
		http.Error(w, data.Title, data.Code)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(data.Code)
	buf.WriteTo(w)
}

// isAuthenticatedSafe tolerates requests without a loaded session (e.g. the
// CSRF failure handler can run outside scs in edge cases).
func (app *application) isAuthenticatedSafe(r *http.Request) bool {
	defer func() { recover() }()
	return app.isAuthenticated(r)
}

func (app *application) serverError(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("server error", "method", r.Method, "url", r.URL.String(), "err", err)
	app.renderErrorPage(w, r, ErrorPageData{
		Code:   http.StatusInternalServerError,
		Title:  "Error interno del servidor",
		Detail: "Algo salió mal de nuestro lado. Intenta de nuevo en un momento.",
	})
}

func (app *application) isAuthenticated(r *http.Request) bool {
	return app.sessions.GetBool(r.Context(), "authenticated")
}
