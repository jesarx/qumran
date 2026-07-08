package main

import (
	"io/fs"
	"net/http"
)

func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	// Archivos estáticos embebidos (css, js, fuentes, favicon)
	staticContent, _ := fs.Sub(staticFS, "static")
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServerFS(staticContent)))
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

	// Cualquier otra ruta: 404 con la página propia
	mux.HandleFunc("/", app.notFound)

	return app.securityHeaders(mux)
}

func (app *application) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}
