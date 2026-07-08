package main

import (
	"context"
	"flag"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/alexedwards/scs/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

type application struct {
	db            *DB
	templates     map[string]*template.Template
	sessions      *scs.SessionManager
	limiter       loginLimiter
	secureCookies bool
}

func main() {
	addr := flag.String("addr", ":4000", "dirección HTTP (ej. :4000)")
	envFile := flag.String("env", ".env", "ruta del archivo .env (opcional)")
	flag.Parse()

	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	slog.SetDefault(logger)

	// Cargar .env si existe (sin expansión de $: los valores son literales).
	if err := loadDotenv(*envFile); err != nil {
		logger.Error("no se pudo leer el .env", "path", *envFile, "err", err)
		os.Exit(1)
	}

	dsn := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s",
		envOr("DB_HOST", "localhost"),
		envOr("DB_PORT", "5432"),
		envOr("DB_NAME", "qumran"),
		envOr("DB_USER", "postgres"),
		envOr("DB_PASSWORD", "postgres"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Error("error creando el pool de BD", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		logger.Error("no se pudo conectar a la BD", "err", err)
		os.Exit(1)
	}

	templates, err := newTemplateCache()
	if err != nil {
		logger.Error("error compilando templates", "err", err)
		os.Exit(1)
	}

	// COOKIE_SECURE=false permite probar sobre HTTP plano (dev). En producción
	// (detrás de HTTPS) se queda el default true.
	secureCookies := envOr("COOKIE_SECURE", "true") != "false"

	sessions := scs.New()
	sessions.Lifetime = 30 * 24 * time.Hour // 30 días, como la app Next
	sessions.Cookie.HttpOnly = true
	sessions.Cookie.SameSite = http.SameSiteLaxMode
	sessions.Cookie.Secure = secureCookies

	app := &application{
		db:            &DB{pool: pool},
		templates:     templates,
		sessions:      sessions,
		secureCookies: secureCookies,
	}

	srv := &http.Server{
		Addr:         *addr,
		Handler:      app.routes(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  time.Minute,
	}

	logger.Info("servidor iniciado", "addr", *addr)
	if err := srv.ListenAndServe(); err != nil {
		logger.Error("servidor detenido", "err", err)
		os.Exit(1)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// loadDotenv reads KEY=VALUE lines literally: no $-expansion, no escapes.
// Surrounding single or double quotes are stripped. Values already present in
// the real environment win over the file. A missing file is not an error.
func loadDotenv(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		if len(value) >= 2 {
			if (value[0] == '\'' && value[len(value)-1] == '\'') ||
				(value[0] == '"' && value[len(value)-1] == '"') {
				value = value[1 : len(value)-1]
			}
		}
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
	return nil
}
