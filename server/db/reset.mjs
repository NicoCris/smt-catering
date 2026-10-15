/**
 * Script de inicialización / reinicio rápido de base de datos SQLite.
 * Usa el soporte nativo de SQLite de Node.js 22+.
 *
 * Ejecutar con: node server/db/reset.mjs (o npm run db:reset)
 */
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, 'smt.sqlite')
const SCHEMA_PATH = resolve(__dirname, 'schema.sql')
const SEED_PATH = resolve(__dirname, 'seed.sql')

console.log('🔄 Reiniciando base de datos SQLite...')

// 1. Eliminar archivo existente si existe
if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH)
  console.log('🗑️  Base de datos previa eliminada.')
}

// 2. Crear nueva base de datos
const db = new DatabaseSync(DB_PATH)

// 3. Ejecutar esquema DDL
const schemaSql = readFileSync(SCHEMA_PATH, 'utf-8')
db.exec(schemaSql)
console.log('✅ Esquema DDL aplicado correctamente (tablas creadas).')

// 4. Ejecutar seed inicial
const seedSql = readFileSync(SEED_PATH, 'utf-8')
db.exec(seedSql)
console.log('🌱 Datos iniciales (seed) cargados exitosamente.')

db.close()
console.log(`🎉 Base de datos lista en: ${DB_PATH}`)

