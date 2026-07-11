package main

import (
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// assetVersion is a short hash of every embedded static file, computed once
// at startup. It goes in the asset URLs (?v=...) so /static/ can be served
// with an immutable cache: each deploy changes the URLs and busts the cache.
func computeAssetVersion() string {
	h := sha256.New()
	fs.WalkDir(staticFS, "static", func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		data, err := staticFS.ReadFile(p)
		if err != nil {
			return err
		}
		h.Write([]byte(p))
		h.Write(data)
		return nil
	})
	return hex.EncodeToString(h.Sum(nil))[:12]
}

// cacheStatic marks /static/ responses as immutable (their URLs are
// versioned with ?v=assetVersion).
func cacheStatic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		next.ServeHTTP(w, r)
	})
}

// ---- gzip -------------------------------------------------------------------

// Extensiones que ya vienen comprimidas: no vale la pena re-comprimirlas.
var gzipSkipExt = map[string]bool{
	".woff2": true, ".woff": true, ".ico": true,
	".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".gz": true,
}

type gzipResponseWriter struct {
	http.ResponseWriter
	gz          *gzip.Writer
	wroteHeader bool
}

func (w *gzipResponseWriter) WriteHeader(code int) {
	if w.wroteHeader {
		return
	}
	w.wroteHeader = true
	// El tamaño comprimido no se conoce de antemano.
	w.Header().Del("Content-Length")
	w.ResponseWriter.WriteHeader(code)
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		WriteHeaderSniff(w, b)
	}
	return w.gz.Write(b)
}

// WriteHeaderSniff replica el comportamiento de net/http: fijar Content-Type
// por sniffing antes del primer write si no está puesto.
func WriteHeaderSniff(w *gzipResponseWriter, b []byte) {
	if w.Header().Get("Content-Type") == "" {
		w.Header().Set("Content-Type", http.DetectContentType(b))
	}
	w.WriteHeader(http.StatusOK)
}

func gzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") ||
			r.Header.Get("Range") != "" ||
			gzipSkipExt[path.Ext(r.URL.Path)] {
			next.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Add("Vary", "Accept-Encoding")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		next.ServeHTTP(&gzipResponseWriter{ResponseWriter: w, gz: gz}, r)
	})
}
