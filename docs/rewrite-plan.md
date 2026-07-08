# Plan de reescritura: Qumran en Go

Reescritura de la app Next.js a Go, manteniendo **la misma base de datos
PostgreSQL** (sin migración de datos), el mismo diseño (Tailwind, tema
oscuro/claro), las mismas URLs y la misma funcionalidad.

> **Para sesiones futuras de Claude**: lee este archivo antes de continuar.
> El progreso se marca en los checkboxes de abajo. El código vive en `go/`.
> Cada etapa termina en estado funcional y commiteado. La app Next.js sigue
> en la raíz del repo y es la referencia de paridad; no se toca hasta el
> cutover final.

## Stack (decidido)

| Capa | Tecnología |
|---|---|
| Servidor | Go, `net/http` con ServeMux moderno (patrones `GET /books/{id}`), sin framework |
| BD | La misma PostgreSQL; driver `jackc/pgx/v5` con `pgxpool` |
| HTML | `html/template`, todo embebido con `go:embed` |
| CSS | Tailwind v4; fuente `go/assets/css/input.css`, se compila a `go/static/css/main.css` (commiteado). Build: `npx @tailwindcss/cli -i assets/css/input.css -o static/css/main.css --minify` (Node solo en build) |
| Iconos | SVGs de lucide extraídos a plantillas (sin dependencia JS) |
| Fuente tipográfica | Raleway variable woff2 vendoreada en `go/static/fonts/` |
| Sesiones | `alexedwards/scs/v2` (cookie de sesión, store en memoria) |
| Auth | Contraseña única: bcrypt vs `ADMIN_PASSWORD_HASH` + lockout 5 intentos/15 min (igual que la versión Next) |
| CSRF | `justinas/nosurf` |
| JS | Vanilla mínimo: tema, autocompletado de autores/editoriales, escáner zxing vendoreado |
| Config | Mismas variables `.env` que la app Next (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `ADMIN_PASSWORD_HASH`, `GOOGLE_BOOKS_API_KEY`); loader propio de `.env` **sin expansión de `$`** (adiós al problema de los escapes) |
| Deploy | Binario único + systemd; puerto propio (default `:4000`) para convivir con la app Next durante la transición |

Notas de alcance (pedidas por el usuario):
- No copiar de más del libro de Alex Edwards: sin capas/paquetes que sobren.
  Paquete `main` plano con archivos por tema.
- Paridad funcional y visual con la app Next (~95%; los combobox serán más
  sobrios que los de shadcn).

## Estructura

```
go/
  main.go          — config, .env loader, pool, arranque
  routes.go        — mux y middleware chain
  handlers.go      — handlers públicos
  handlers_admin.go— handlers del dashboard (etapa 4)
  auth.go          — login/sesiones/lockout (etapa 3)
  db.go            — queries (puerto de lib/queries/*.ts)
  models.go        — structs
  render.go        — cache de templates, helpers, funcs
  icons.go         — SVGs lucide como template.HTML
  templates/       — *.tmpl (base + páginas + parciales)
  static/          — css/main.css (build), fonts/, js/
  assets/css/input.css — fuente Tailwind
```

## Referencias de paridad (app Next)

- Colores/tema: `app/globals.css` (variables HSL, clases .dark/.light)
- Layout: `app/layout.tsx`, `components/app-sidebar.tsx`, `components/footer.tsx`
- Home: `app/page.tsx`
- Tablas/filtros: `components/books-table.tsx`, `components/book-filters.tsx`
- Queries: `lib/queries/*.ts` (portar el SQL tal cual; usa funciones de BD
  `get_author_sort_priority`, `normalize_*` que ya existen en la BD)
- Auth: `auth.ts` (misma semántica de lockout y bcrypt)
- URLs y query params idénticos: `/books?authorSlug=&publisherSlug=&categorySlug=&locationSlug=&scanned=&sort=&search=&page=`

## Etapas y progreso

- [x] **Etapa 1 — Esqueleto**: servidor, config/.env, pgxpool, templates
      embebidos, Tailwind, layout (sidebar/footer/tema), home con estadísticas.
      (Verificada contra la réplica: paridad visual con la app Next, screenshot
      lado a lado. Home renderiza 1144 libros, stats y rankings reales.)
- [ ] **Etapa 2 — Catálogo público**: `/books` (filtros, orden, paginación),
      `/books/{id}`, `/authors`, `/publishers`, `/tags`, `/locations`, `/about`.
- [ ] **Etapa 3 — Auth**: `/login`, `/logout`, sesiones scs, lockout, CSRF,
      middleware de `/dashboard`.
- [ ] **Etapa 4 — Dashboard CRUD**: libros (crear/editar/borrar, find-or-create
      de autores/editoriales, campo scanned), autores, editoriales, ubicaciones.
- [ ] **Etapa 5 — Extras**: búsqueda Google Books por ISBN, escáner de códigos
      (zxing vendoreado), autocompletado.
- [ ] **Etapa 6 — Deploy**: systemd, guía de build y cutover.

## Cómo probar localmente (entorno de desarrollo de Claude)

Hay una réplica PG17 de la BD real en el entorno (restaurada de los dumps):
socket `/home/pg/pgrun` puerto `5444`, TCP `127.0.0.1:5444`, usuario
`postgres`, BD `qumran`. Si no está corriendo:
`su pg -c "PATH=/tmp/pg17/bin:$PATH pg_ctl -D /home/pg/pgdata -o \"-c listen_addresses='127.0.0.1' -k /home/pg/pgrun -p 5444\" -l /home/pg/pglog.log -w start"`
(binarios PG17 en /tmp/pg17; si el contenedor se recicló, ver historial de la
sesión: se descargan de conda-forge/zonky).

Correr la app Go:
`cd go && DB_HOST=127.0.0.1 DB_PORT=5444 DB_USER=postgres DB_PASSWORD=postgres DB_NAME=qumran go run . -addr :4000`
