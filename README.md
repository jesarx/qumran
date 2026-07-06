# Qumran

Sistema de gestión de biblioteca personal desarrollado con Next.js 14, TypeScript y PostgreSQL.

## 📚 Descripción

Qumran es una aplicación web diseñada para organizar, catalogar y administrar colecciones de libros de manera eficiente. Permite llevar un control detallado de autores, editoriales, categorías y ubicaciones físicas de los libros.

El nombre "Qumran" hace referencia al sitio arqueológico donde se descubrieron los famosos Manuscritos del Mar Muerto, simbolizando la preservación y organización del conocimiento a lo largo del tiempo.

## ✨ Características

- **Catalogación Completa**: Gestión de títulos, autores, editoriales, ISBN y categorías
- **Búsqueda Avanzada**: Filtros por título, autor, editorial, categoría y ubicación
- **Ubicaciones Físicas**: Control de dónde se encuentran físicamente los libros
- **Escáner de Código de Barras**: Búsqueda automática de información mediante ISBN
- **Interfaz Responsiva**: Diseño adaptado para escritorio y dispositivos móviles  
- **Tema Oscuro/Claro**: Soporte para modo oscuro y claro según preferencia
- **Autenticación**: Sistema de login con Google OAuth
- **Panel de Administración**: Gestión completa de la biblioteca

## 🛠️ Tecnologías

### Frontend
- **Next.js 14** con App Router
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Radix UI** para componentes
- **Lucide React** para iconos

### Backend
- **Next.js API Routes** y Server Actions
- **PostgreSQL** como base de datos
- **pg** para conexión directa a PostgreSQL
- **NextAuth.js** para autenticación

### Herramientas
- **ZXing** para escaneo de códigos de barras
- **Open Library API** para búsqueda de información de libros
- **Vercel** para deployment

## 📋 Requisitos

- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/jesarx/qumran.git
cd qumran
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Database
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/qumran"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_secret_aqui"

# Login con contraseña (hash bcrypt, nunca la contraseña en texto plano).
# Generar el hash con:
#   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'tu-contraseña'
# Usar comillas simples: el hash contiene caracteres $.
ADMIN_PASSWORD_HASH='$2b$12$...'
```

4. **Configurar base de datos**
```bash
# Ejecutar el script SQL para crear las tablas
psql -d qumran -f database/schema.sql
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
qumran/
├── app/                    # App Router de Next.js
│   ├── about/             # Página "Acerca de"
│   ├── authors/           # Páginas de autores
│   ├── books/             # Páginas de libros
│   ├── dashboard/         # Panel de administración
│   └── ...
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI base
│   └── ...
├── lib/                   # Utilidades y configuraciones
│   ├── actions.ts        # Server Actions
│   ├── queries.ts        # Consultas a base de datos
│   └── ...
├── database/             # Scripts de base de datos
│   └── schema.sql        # Esquema de la base de datos
└── ...
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción  
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar ESLint
- `npm run type-check` - Verificar tipos de TypeScript

## 📖 Uso

### Navegación Pública
- **Libros**: Explorar la colección completa con filtros avanzados
- **Autores**: Ver todos los autores y sus obras
- **Editoriales**: Listado de editoriales con sus publicaciones
- **Categorías**: Explorar libros por categoría
- **Acerca de**: Información sobre el proyecto

### Panel de Administración
Requiere autenticación con Google OAuth:
- **Dashboard**: Estadísticas generales de la biblioteca
- **Gestión de Libros**: Agregar, editar y eliminar libros
- **Gestión de Autores**: Administrar información de autores
- **Gestión de Editoriales**: Controlar editoriales
- **Gestión de Ubicaciones**: Organizar ubicaciones físicas

### Agregar Libros
1. Acceder al panel de administración
2. Ir a "Gestionar Libros" → "Agregar libro"
3. Escanear código de barras o ingresar ISBN manualmente
4. Completar información adicional
5. Asignar categoría y ubicación

## 📝 Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

## 👨‍💻 Desarrollador

**Eduardo Partida**
- Sitio web: [edpartida.com](https://edpartida.com)
- Email: [edpartida@proton.me](mailto:edpartida@proton.me)
- GitHub: [@jesarx](https://github.com/jesarx)

