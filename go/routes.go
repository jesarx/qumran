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
