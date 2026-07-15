package main

import (
	"io/fs"
	"log/slog"
	"net/http"

	"github.com/justinas/nosurf"
)

func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	// Archivos estáticos embebidos (css, js, fuentes, favicon)
	staticContent, _ := fs.Sub(staticFS, "static")
	mux.Handle("GET /static/", cacheStatic(http.StripPrefix("/static/", http.FileServerFS(staticContent))))
	mux.HandleFunc("GET /favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, staticContent, "favicon.ico")
	})

	// Público
	mux.HandleFunc("GET /{$}", app.homeHandler)
	mux.HandleFunc("GET /books", app.booksHandler)
	mux.HandleFunc("GET /books/{id}", app.bookDetailHandler)
	mux.HandleFunc("GET /authors", app.authorsHandler)
	mux.HandleFunc("GET /publishers", app.publishersHandler)
	mux.HandleFunc("GET /tags", app.tagsHandler)
	mux.HandleFunc("GET /locations", app.locationsHandler)
	mux.HandleFunc("GET /about", app.aboutHandler)

	// Auth
	mux.HandleFunc("GET /login", app.loginPageHandler)
	mux.HandleFunc("POST /login", app.loginPostHandler)
	mux.HandleFunc("POST /logout", app.logoutHandler)

	// Dashboard (protegido). El sub-mux ve el path completo.
	dashboard := http.NewServeMux()
	dashboard.HandleFunc("GET /dashboard", app.dashboardHandler)

	dashboard.HandleFunc("GET /dashboard/books", redirectTo("/books"))
	dashboard.HandleFunc("GET /dashboard/books/new", app.bookNewFormHandler)
	dashboard.HandleFunc("POST /dashboard/books/new", app.bookCreateHandler)
	dashboard.HandleFunc("GET /dashboard/books/{id}", app.bookEditFormHandler)
	dashboard.HandleFunc("POST /dashboard/books/{id}", app.bookUpdateHandler)
	dashboard.HandleFunc("POST /dashboard/books/{id}/delete", app.bookDeleteHandler)

	dashboard.HandleFunc("GET /dashboard/authors", redirectTo("/authors"))
	dashboard.HandleFunc("GET /dashboard/authors/{id}", app.authorEditFormHandler)
	dashboard.HandleFunc("POST /dashboard/authors/{id}", app.authorUpdateHandler)
	dashboard.HandleFunc("POST /dashboard/authors/{id}/delete", app.authorDeleteHandler)

	dashboard.HandleFunc("GET /dashboard/publishers", redirectTo("/publishers"))
	dashboard.HandleFunc("GET /dashboard/publishers/{id}", app.publisherEditFormHandler)
	dashboard.HandleFunc("POST /dashboard/publishers/{id}", app.publisherUpdateHandler)
	dashboard.HandleFunc("POST /dashboard/publishers/{id}/delete", app.publisherDeleteHandler)

	dashboard.HandleFunc("GET /dashboard/api/isbn", app.isbnLookupHandler)

	dashboard.HandleFunc("GET /dashboard/locations", redirectTo("/locations"))
	dashboard.HandleFunc("GET /dashboard/locations/new", app.locationNewFormHandler)
	dashboard.HandleFunc("POST /dashboard/locations/new", app.locationCreateHandler)
	dashboard.HandleFunc("GET /dashboard/locations/{id}", app.locationEditFormHandler)
	dashboard.HandleFunc("POST /dashboard/locations/{id}", app.locationUpdateHandler)
	dashboard.HandleFunc("POST /dashboard/locations/{id}/delete", app.locationDeleteHandler)

	dashboard.HandleFunc("/", app.notFound)
	mux.Handle("/dashboard", app.requireAuth(dashboard))
	mux.Handle("/dashboard/", app.requireAuth(dashboard))

	// Cualquier otra ruta: 404 con la página propia
	mux.HandleFunc("/", app.notFound)

	// CSRF en todos los POST; sesiones cargadas/guardadas en cada request.
	csrf := nosurf.New(mux)
	csrf.SetBaseCookie(http.Cookie{
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   app.secureCookies,
	})
	csrf.SetFailureHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Warn("CSRF rechazado", "url", r.URL.Path, "reason", nosurf.Reason(r))
		app.renderErrorPage(w, r, ErrorPageData{
			Code:   http.StatusBadRequest,
			Title:  "Solicitud inválida",
			Detail: "La sesión del formulario expiró o la petición no es válida. Regresa e intenta de nuevo.",
		})
	}))
	// Detrás del proxy TLS (nginx/caddy) la conexión local es HTTP plano;
	// nosurf necesita saber el esquema real para el chequeo de mismo origen.
	csrf.SetIsTLSFunc(func(r *http.Request) bool {
		return r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https"
	})

	return app.securityHeaders(gzipMiddleware(app.sessions.LoadAndSave(csrf)))
}

func (app *application) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}
