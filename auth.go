package main

import (
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Single-admin password login, same semantics as the Next.js version:
// the password is never stored — only its bcrypt hash in ADMIN_PASSWORD_HASH.
// Generate the ready-to-paste .env line with: node scripts/hash-password.js
// (or: htpasswd -bnBC 12 "" 'contraseña' | tr -d ':\n').
//
// Brute-force lockout: after maxAttempts failures within lockoutWindow all
// logins are rejected until the window expires, even with the right password.

const (
	lockoutWindow = 15 * time.Minute
	maxAttempts   = 5
)

// Hash of a throwaway string; compared against when ADMIN_PASSWORD_HASH is
// missing so a misconfigured server doesn't answer instantly (timing oracle).
const dummyHash = "$2b$12$7JzX0GFft2BILcWAkQCYUOY6w.yPIcAOu4BmrB0fraTfJ6pkfNZFO"

type loginLimiter struct {
	mu       sync.Mutex
	failures []time.Time
}

func (l *loginLimiter) lockedOut() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	cutoff := time.Now().Add(-lockoutWindow)
	kept := l.failures[:0]
	for _, t := range l.failures {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	l.failures = kept
	return len(l.failures) >= maxAttempts
}

func (l *loginLimiter) recordFailure() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.failures = append(l.failures, time.Now())
}

func (l *loginLimiter) reset() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.failures = nil
}

// checkPassword verifies the password against ADMIN_PASSWORD_HASH,
// enforcing the lockout. It always burns a bcrypt compare.
func (app *application) checkPassword(password string) bool {
	if password == "" {
		return false
	}
	if app.limiter.lockedOut() {
		slog.Error("login bloqueado: demasiados intentos fallidos")
		return false
	}
	hash := os.Getenv("ADMIN_PASSWORD_HASH")
	if hash == "" {
		slog.Error("ADMIN_PASSWORD_HASH no está configurado: login denegado")
		bcrypt.CompareHashAndPassword([]byte(dummyHash), []byte(password))
		return false
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		app.limiter.recordFailure()
		return false
	}
	app.limiter.reset()
	return true
}

// ---- Handlers ---------------------------------------------------------------

type LoginPageData struct {
	Error string
	Next  string
}

func (app *application) loginPageHandler(w http.ResponseWriter, r *http.Request) {
	if app.isAuthenticated(r) {
		http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
		return
	}
	app.render(w, r, http.StatusOK, "login", templateData{
		Login: &LoginPageData{Next: safeNext(r.URL.Query().Get("next"))},
	})
}

func (app *application) loginPostHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		app.serverError(w, r, err)
		return
	}
	next := safeNext(r.PostForm.Get("next"))

	if !app.checkPassword(r.PostForm.Get("password")) {
		app.render(w, r, http.StatusUnprocessableEntity, "login", templateData{
			Login: &LoginPageData{Error: "Contraseña incorrecta.", Next: next},
		})
		return
	}

	// Renovar el token de sesión al elevar privilegios (evita session fixation).
	if err := app.sessions.RenewToken(r.Context()); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Put(r.Context(), "authenticated", true)

	if next == "" {
		next = "/dashboard"
	}
	http.Redirect(w, r, next, http.StatusSeeOther)
}

func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	if err := app.sessions.RenewToken(r.Context()); err != nil {
		app.serverError(w, r, err)
		return
	}
	app.sessions.Remove(r.Context(), "authenticated")
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// requireAuth protects /dashboard: unauthenticated users go to /login with
// the intended destination in ?next=.
func (app *application) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !app.isAuthenticated(r) {
			dest := "/login"
			if r.Method == http.MethodGet {
				dest += "?next=" + url.QueryEscape(r.URL.RequestURI())
			}
			http.Redirect(w, r, dest, http.StatusSeeOther)
			return
		}
		// Las páginas autenticadas no deben quedar en caches compartidos.
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

// safeNext only accepts same-site relative paths as post-login destinations.
func safeNext(next string) string {
	if strings.HasPrefix(next, "/") && !strings.HasPrefix(next, "//") {
		return next
	}
	return ""
}
