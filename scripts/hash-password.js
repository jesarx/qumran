#!/usr/bin/env node
// Genera el hash bcrypt de la contraseña de administración y la línea lista
// para pegar en el .env.
//
// Uso:
//   node scripts/hash-password.js 'tu-contraseña'
//
// Nota: cada ejecución produce un hash distinto porque bcrypt incluye una sal
// aleatoria; todos son válidos para la misma contraseña.

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error("Uso: node scripts/hash-password.js 'tu-contraseña'");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

// Next.js expande $VAR dentro de los archivos .env (incluso entre comillas),
// así que cada $ del hash debe escaparse como \$ o el valor llega mutilado
// a la aplicación.
const escaped = hash.replace(/\$/g, '\\$');

console.log('Línea lista para pegar en tu .env:\n');
console.log(`ADMIN_PASSWORD_HASH='${escaped}'`);
