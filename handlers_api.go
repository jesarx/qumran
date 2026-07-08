package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"time"
)

// isbnLookupHandler proxies the Google Books lookup server-side (the API key
// never reaches the browser). Ported from searchBookByISBN in
// lib/actions/books.ts. Response: {found, title, authors, publisher, subjects}.
func (app *application) isbnLookupHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON := func(status int, v any) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(v)
	}
	notFound := map[string]any{"found": false}

	isbn := onlyDigits(r.URL.Query().Get("isbn"))
	if len(isbn) != 10 && len(isbn) != 13 {
		writeJSON(http.StatusOK, notFound)
		return
	}
	apiKey := os.Getenv("GOOGLE_BOOKS_API_KEY")
	if apiKey == "" {
		slog.Warn("GOOGLE_BOOKS_API_KEY no configurada")
		writeJSON(http.StatusOK, notFound)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	apiURL := "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn + "&key=" + url.QueryEscape(apiKey)
	resp, err := client.Get(apiURL)
	if err != nil {
		slog.Error("error consultando Google Books", "err", err)
		writeJSON(http.StatusOK, notFound)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		slog.Error("Google Books respondió error", "status", resp.StatusCode)
		writeJSON(http.StatusOK, notFound)
		return
	}

	var data struct {
		Items []struct {
			VolumeInfo struct {
				Title      string   `json:"title"`
				Authors    []string `json:"authors"`
				Publisher  string   `json:"publisher"`
				Categories []string `json:"categories"`
			} `json:"volumeInfo"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil || len(data.Items) == 0 {
		writeJSON(http.StatusOK, notFound)
		return
	}

	book := data.Items[0].VolumeInfo
	writeJSON(http.StatusOK, map[string]any{
		"found":     true,
		"title":     book.Title,
		"authors":   book.Authors,
		"publisher": book.Publisher,
		"subjects":  book.Categories,
	})
}
