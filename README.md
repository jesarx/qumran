# Qumran

Sistema de gestión de biblioteca personal. Catálogo público de libros con
autores, editoriales, categorías y ubicaciones físicas, más un panel de
administración con escáner de códigos de barras y búsqueda automática de
metadatos por ISBN.

Aplicación en **Go** (un solo binario, sin runtime de Node) sobre
**PostgreSQL**. El HTML se renderiza en el servidor con `html/template`;
el CSS es Tailwind compilado a un archivo estático; todo (plantillas,
CSS, fuentes, iconos, JS) va embebido en el binario.

## Stack

- Go (`net/http`, sin framework) + `pgx/v5`
- PostgreSQL
- Tailwind CSS v4 (solo en build; `static/css/main.css` va commiteado)
- Sesiones: `alexedwards/scs` · CSRF: `justinas/nosurf` · bcrypt
- Escáner de ISBN: zxing (vendoreado en `static/js/vendor/`)

## Desarrollo

Requisitos: Go 1.24+, PostgreSQL.

```bash
# Base de datos (esquema completo en db/schema.sql, migraciones en db/migrations/)
psql -d qumran -f db/schema.sql

# Configuración
cp .env.example .env   # o crear .env a mano, ver variables abajo

# Correr
go build -o qumran . && ./qumran -addr :4000
```

Variables de entorno (`.env` en el directorio de trabajo, valores literales,
sin expansión de `$`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qumran
DB_USER=qumran
DB_PASSWORD=...

# Hash bcrypt de la contraseña de administración. Generarlo con:
#   ./qumran -hashpw 'tu-contraseña'
ADMIN_PASSWORD_HASH='$2b$12$...'

# API de Google Books (búsqueda por ISBN en el formulario de alta)
GOOGLE_BOOKS_API_KEY=...

# Solo para pruebas locales sobre HTTP plano:
# COOKIE_SECURE=false
```

### Reconstruir el CSS

Solo hace falta si cambias clases en `templates/` o `static/js/`:

```bash
npm install --no-save tailwindcss@4 @tailwindcss/cli@4
npx tailwindcss -i assets/css/input.css -o static/css/main.css --minify
rm -rf node_modules package.json package-lock.json   # limpieza opcional
```

(Node solo se usa para esto en tiempo de build; el binario no lo necesita.
El paquete `tailwindcss` debe estar en un `node_modules` junto al proyecto
porque el `@import "tailwindcss"` del CSS se resuelve desde ahí.)

## Deploy

Binario + systemd detrás de nginx/caddy con HTTPS. Ver `deploy/qumran.service`.
El proxy debe mandar `X-Forwarded-Proto` (estándar en nginx:
`proxy_set_header X-Forwarded-Proto $scheme;`).

```bash
git pull
go build -o qumran .
sudo systemctl restart qumran
```

## Historia

La versión original estaba escrita en Next.js; fue reescrita en Go
manteniendo la misma base de datos, las mismas URLs y el mismo diseño.
El plan y las notas de la reescritura están en `docs/rewrite-plan.md`.
