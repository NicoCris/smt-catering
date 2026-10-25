/**
 * Punto de entrada del servidor Backend de SMT Catering.
 * Servidor HTTP nativo de Node.js conectado a la base de datos SQLite.
 */
import { createServer } from 'node:http'
import { getDatabase } from './db/client.ts'

const PORT = Number(process.env.PORT) || 3001

const server = createServer((req, res) => {
  // Encabezados CORS y JSON
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (url.pathname === '/api/health') {
    res.writeHead(200)
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }

  if (url.pathname === '/api/tariffs') {
    try {
      const db = getDatabase()
      const tariffs = db.prepare('SELECT * FROM tarifas WHERE is_active = 1').all()
      res.writeHead(200)
      res.end(JSON.stringify({ tariffs }))
    } catch (err: any) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  if (url.pathname === '/api/events') {
    try {
      const db = getDatabase()
      const events = db
        .prepare(
          `SELECT r.*, c.razon_social as cliente_empresa, c.nombre_completo as contacto
           FROM reserva r
           JOIN cliente c ON c.id_cliente = r.id_cliente
           ORDER BY r.fecha_evento ASC`,
        )
        .all()
      res.writeHead(200)
      res.end(JSON.stringify({ events }))
    } catch (err: any) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Ruta no encontrada', path: url.pathname }))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SMT Catering Server corriendo en http://localhost:${PORT}`)
  console.log(`📡 Endpoints disponibles en SQLite:`)
  console.log(`   - GET  http://localhost:${PORT}/api/health`)
  console.log(`   - GET  http://localhost:${PORT}/api/tariffs`)
  console.log(`   - GET  http://localhost:${PORT}/api/events`)
})
