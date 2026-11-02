/**
 * Cliente de Base de Datos Unificado para SMT Catering.
 * Soporte dual inteligente:
 * - Si DATABASE_URL está definido en el entorno (.env) -> Conecta a Neon PostgreSQL (Cloud).
 * - Si no está definido -> Conecta a SQLite local nativo (Node 22) para desarrollo offline.
 */
import 'dotenv/config'
import pg from 'pg'
import { DatabaseSync } from 'node:sqlite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

export interface DbQueryInterface {
  isPostgres: boolean
  query: (sql: string, params?: any[]) => Promise<any[]>
  execute: (sql: string, params?: any[]) => Promise<{ lastInsertId?: number; changes?: number }>
  getPool?: () => pg.Pool | null
  getSqlite?: () => DatabaseSync | null
}

let dbInterfaceInstance: DbQueryInterface | null = null

function convertSqlitePlaceholdersToPg(sql: string): string {
  let paramIndex = 1
  return sql.replace(/\?/g, () => `$${paramIndex++}`)
}

export function getDatabaseAdapter(): DbQueryInterface {
  if (dbInterfaceInstance) {
    return dbInterfaceInstance
  }

  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    dbInterfaceInstance = {
      isPostgres: true,
      async query(sql: string, params: any[] = []) {
        const pgSql = convertSqlitePlaceholdersToPg(sql)
        const res = await pool.query(pgSql, params)
        return res.rows
      },
      async execute(sql: string, params: any[] = []) {
        const pgSql = convertSqlitePlaceholdersToPg(sql)
        const res = await pool.query(pgSql, params)
        const lastInsertId = res.rows[0]?.id || res.rows[0]?.id_cliente || res.rows[0]?.id_reserva
        return {
          lastInsertId: lastInsertId ? Number(lastInsertId) : undefined,
          changes: res.rowCount ?? 0,
        }
      },
      getPool: () => pool,
      getSqlite: () => null,
    }

    return dbInterfaceInstance
  }

  // Fallback SQLite local
  const DB_PATH = resolve(__dirname, 'smt.sqlite')
  const sqlite = new DatabaseSync(DB_PATH)

  dbInterfaceInstance = {
    isPostgres: false,
    async query(sql: string, params: any[] = []) {
      const stmt = sqlite.prepare(sql)
      return stmt.all(...params) as any[]
    },
    async execute(sql: string, params: any[] = []) {
      const stmt = sqlite.prepare(sql)
      const res = stmt.run(...params) as any
      return {
        lastInsertId: res.lastInsertRowid ? Number(res.lastInsertRowid) : undefined,
        changes: res.changes,
      }
    },
    getPool: () => null,
    getSqlite: () => sqlite,
  }

  return dbInterfaceInstance
}

// Mantener compatibilidad hacia atrás
export function getDatabase(): DatabaseSync {
  const DB_PATH = resolve(__dirname, 'smt.sqlite')
  return new DatabaseSync(DB_PATH)
}
