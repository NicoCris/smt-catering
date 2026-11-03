import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __dirname = dirname(fileURLToPath(import.meta.url))
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ Error: No se encontró DATABASE_URL en el archivo .env')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Ejecutando DDL (schema.sql) en Neon PostgreSQL...')
    const schemaSql = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8')
    await client.query(schemaSql)
    console.log('✅ Tablas creadas / verificadas con éxito en Neon.')

    console.log('🌱 Cargando datos iniciales (seed.sql) en Neon PostgreSQL...')
    const seedSql = readFileSync(resolve(__dirname, 'seed.sql'), 'utf-8')
    await client.query(seedSql)
    console.log('✅ Datos iniciales sembrados con éxito en Neon.')

    const res = await client.query('SELECT count(*) as total FROM reserva')
    console.log(`🎉 Total de reservas en Neon: ${res.rows[0].total}`)
  } catch (err) {
    console.error('❌ Error durante la migración a Neon:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
