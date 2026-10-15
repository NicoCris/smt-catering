/**
 * Cliente de conexión a SQLite usando el soporte nativo de Node.js 22+.
 * Preparado para reemplazar por Neon/Postgres cuando se active el entorno cloud.
 */
import { DatabaseSync } from 'node:sqlite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, 'smt.sqlite')

let dbInstance: DatabaseSync | null = null

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH)
  }
  return dbInstance
}

