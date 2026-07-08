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

var templateFuncs = template.FuncMap{
	"icon": icon,
	"add":  func(a, b int) int { return a + b },
	"sub":  func(a, b int) int { return a - b },
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
	Flash           string

	Home *HomeData
}

func (app *application) render(w http.ResponseWriter, r *http.Request, status int, page string, data templateData) {
	ts, ok := app.templates[page]
	if !ok {
		app.serverError(w, r, fmt.Errorf("template %q not found", page))
		return
	}

	data.CurrentPath = r.URL.Path
	data.IsAuthenticated = app.isAuthenticated(r)

	buf := new(bytes.Buffer)
	if err := ts.ExecuteTemplate(buf, "base", data); err != nil {
		app.serverError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	buf.WriteTo(w)
}

func (app *application) serverError(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("server error", "method", r.Method, "url", r.URL.String(), "err", err)
	http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
}

// isAuthenticated is wired for real in stage 3 (sessions); for now nobody is.
func (app *application) isAuthenticated(r *http.Request) bool {
	return false
}
