/**
 * Punto de entrada del servidor Backend de SMT Catering.
 * Servidor HTTP nativo de Node.js conectado a la base de datos SQLite (MER_v3).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { getDatabase } from './db/client.ts'

const PORT = Number(process.env.PORT) || 3001

/** Crea la tabla de tokens de reset de contraseña si no existe (idempotente). */
function ensureResetTokensTable(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )
  `)
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  for (const cookie of cookieHeader.split(';')) {
    const parts = cookie.split('=')
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim())
    }
  }
  return list
}

function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    ...headers,
  })
  res.end(JSON.stringify(data))
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function fetchAllEvents(db: any) {
  const rows = db
    .prepare(
      `SELECT
        r.*,
        c.razon_social as cliente_empresa,
        c.nombre_completo as contacto
      FROM reserva r
      JOIN cliente c ON c.id_cliente = r.id_cliente
      ORDER BY r.fecha_evento ASC`,
    )
    .all()

  const stationsStmt = db.prepare(`
    SELECT e.codigo
    FROM detalle_reserva_estacion dre
    JOIN estacion e ON e.id_estacion = dre.id_estacion
    WHERE dre.id_reserva = ?
  `)

  const dietaryStmt = db.prepare(`
    SELECT tipo_restriccion, cantidad_personas, observaciones
    FROM restriccion_alimentaria
    WHERE id_reserva = ?
  `)

  const pagosStmt = db.prepare(`
    SELECT tipo_pago, monto, estado
    FROM pago
    WHERE id_reserva = ? AND estado = 'confirmado'
  `)

  return rows.map((r: any) => {
    const stations = stationsStmt.all(r.id_reserva).map((s: any) => s.codigo)
    const dietaryRows = dietaryStmt.all(r.id_reserva)
    const pagos = pagosStmt.all(r.id_reserva)

    let celiacos = 0
    let vegetarianos = 0
    let veganos = 0
    const alergias: string[] = []

    for (const d of dietaryRows) {
      const tipo = (d.tipo_restriccion || '').toLowerCase()
      if (tipo.includes('celia')) celiacos += d.cantidad_personas
      else if (tipo.includes('vege')) vegetarianos += d.cantidad_personas
      else if (tipo.includes('vega')) veganos += d.cantidad_personas
      else if (tipo.includes('alerg')) {
        if (d.observaciones) alergias.push(d.observaciones)
      }
    }

    let depositPesos = 0
    for (const p of pagos) {
      if (p.tipo_pago === 'SEÑA' || p.tipo_pago === 'TOTAL') {
        depositPesos += p.monto
      }
    }

    return {
      id: `EV-${r.id_reserva}`,
      clientName: r.cliente_empresa || r.contacto,
      eventDate: r.fecha_evento,
      guests: r.cantidad_invitados,
      stationIds: stations,
      status: r.estado_evento || 'Presupuestado',
      paymentStatus: r.estado_pago || 'SEÑA_PENDIENTE',
      totalCents: Math.round(r.monto_total * 100),
      depositCents: Math.round(depositPesos * 100),
      dietary: {
        celiacos,
        vegetarianos,
        veganos,
        alergias: alergias.join(', '),
      },
      kitchenNotes: r.notas_cocina || '',
      startTime: r.hora_inicio,
      endTime: r.hora_fin,
      durationHours: r.duracion_horas,
      locationAddress: r.direccion_evento,
      distanceKm: r.distancia_km,
      insuranceCents: Math.round((r.monto_seguro || 0) * 100),
    }
  })
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    })
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const db = getDatabase()

  // 1. Health check
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
  }

  // 2. Tarifas
  if (url.pathname === '/api/tariffs' && req.method === 'GET') {
    try {
      const rows = db
        .prepare('SELECT id, label, category, price_per_guest_cents, fixed_cents FROM tarifas WHERE is_active = 1')
        .all() as any[]
      const tariffs = rows.map((r) => ({
        id: r.id,
        label: r.label,
        category: r.category,
        pricePerGuestCents: r.price_per_guest_cents,
        fixedCents: r.fixed_cents,
      }))
      return sendJson(res, 200, { tariffs })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname.startsWith('/api/tariffs/') && req.method === 'PUT') {
    try {
      const id = url.pathname.replace('/api/tariffs/', '')
      const body = await parseBody(req)
      const stmt = db.prepare(
        'UPDATE tarifas SET price_per_guest_cents = ?, fixed_cents = COALESCE(?, fixed_cents) WHERE id = ?',
      )
      stmt.run(body.pricePerGuestCents, body.fixedCents ?? null, id)
      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/tariffs/bulk' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const list = body.tariffs as Array<{ id: string; pricePerGuestCents: number; fixedCents?: number }>
      if (Array.isArray(list)) {
        const stmt = db.prepare('UPDATE tarifas SET price_per_guest_cents = ? WHERE id = ?')
        for (const t of list) {
          stmt.run(t.pricePerGuestCents, t.id)
        }
      }
      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 3. Eventos
  if (url.pathname === '/api/events' && req.method === 'GET') {
    try {
      const events = fetchAllEvents(db)
      return sendJson(res, 200, { events })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/events' && req.method === 'POST') {
    try {
      const body = await parseBody(req)

      // 1. Cliente B2B (obtener o crear)
      let cliente = db.prepare('SELECT id_cliente FROM cliente WHERE razon_social = ?').get(body.clientName) as any
      let idCliente = cliente?.id_cliente
      if (!idCliente) {
        const insertCliente = db.prepare(`
          INSERT INTO cliente (razon_social, cuit, nombre_completo, email, password_hash)
          VALUES (?, ?, ?, ?, ?)
        `)
        const result = insertCliente.run(
          body.clientName,
          `30-${Date.now().toString().slice(-8)}-1`,
          body.clientName,
          `eventos@${body.clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente'}.com`,
          'temp_hash',
        )
        idCliente = Number(result.lastInsertRowid)
      }

      // 2. Reserva
      const totalPesos = (body.totalCents || 0) / 100
      const seguroPesos = (body.insuranceCents || 0) / 100

      const insertReserva = db.prepare(`
        INSERT INTO reserva (
          id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
          cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
          estado_evento, estado_pago, notas_cocina, monto_total, monto_seguro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const reservaResult = insertReserva.run(
        idCliente,
        body.eventDate,
        body.startTime || '19:30',
        body.endTime || '22:30',
        body.durationHours || 3.0,
        body.guests || 50,
        body.locationAddress || 'CABA',
        body.distanceKm || 10.0,
        0,
        body.status || 'Señado / Confirmado',
        body.paymentStatus || 'SEÑA_ABONADA',
        body.kitchenNotes || '',
        totalPesos,
        seguroPesos,
      )

      const idReserva = Number(reservaResult.lastInsertRowid)

      // 3. Detalle de Estaciones
      if (Array.isArray(body.stationIds)) {
        const getStation = db.prepare('SELECT id_estacion, precio_por_persona FROM estacion WHERE codigo = ?')
        const insertDetalle = db.prepare(`
          INSERT INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado)
          VALUES (?, ?, ?)
        `)
        for (const stationSlug of body.stationIds) {
          const s = getStation.get(stationSlug) as any
          if (s) {
            const subtotal = s.precio_por_persona * (body.guests || 50)
            insertDetalle.run(idReserva, s.id_estacion, subtotal)
          }
        }
      }

      // 4. Restricciones Alimentarias
      if (body.dietary) {
        const insertRestriccion = db.prepare(`
          INSERT INTO restriccion_alimentaria (id_reserva, tipo_restriccion, cantidad_personas, observaciones)
          VALUES (?, ?, ?, ?)
        `)
        if (body.dietary.celiacos > 0)
          insertRestriccion.run(idReserva, 'Celiaquía', body.dietary.celiacos, 'Menú celíaco')
        if (body.dietary.vegetarianos > 0)
          insertRestriccion.run(idReserva, 'Vegetarianos', body.dietary.vegetarianos, 'Menú vegetariano')
        if (body.dietary.veganos > 0)
          insertRestriccion.run(idReserva, 'Veganos', body.dietary.veganos, 'Menú vegano')
        if (body.dietary.alergias)
          insertRestriccion.run(idReserva, 'Alergias', 1, body.dietary.alergias)
      }

      // 5. Pago inicial (seña)
      if (body.depositCents > 0) {
        const insertPago = db.prepare(`
          INSERT INTO pago (id_reserva, tipo_pago, monto, pago_online, pago_completo, estado)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        insertPago.run(idReserva, 'SEÑA', body.depositCents / 100, 1, 0, 'confirmado')
      }

      const all = fetchAllEvents(db)
      const created = all.find((e: any) => e.id === `EV-${idReserva}`)
      return sendJson(res, 201, { event: created })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname.startsWith('/api/events/') && req.method === 'PATCH') {
    try {
      const rawId = url.pathname.replace('/api/events/', '').replace('EV-', '')
      const idReserva = Number(rawId)
      const body = await parseBody(req)

      db.prepare(`
        UPDATE reserva
        SET
          estado_evento = COALESCE(?, estado_evento),
          estado_pago = COALESCE(?, estado_pago),
          notas_cocina = COALESCE(?, notas_cocina),
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_reserva = ?
      `).run(body.status ?? null, body.paymentStatus ?? null, body.kitchenNotes ?? null, idReserva)

      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 4. Autenticación & Sesión
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const input = (body.usernameOrEmail || '').trim().toLowerCase()
      const pass = body.pass || ''

      // Credencial master admin/admin o admin/admin123
      if (input === 'admin' && (pass === 'admin' || pass === 'admin123')) {
        const user = {
          id: 2,
          username: 'admin',
          fullName: 'Coordinador Comercial',
          email: 'admin@smtcatering.com',
          role: 'admin',
        }
        return sendJson(res, 200, { user }, { 'Set-Cookie': 'smt_session=2; Path=/; HttpOnly; SameSite=Lax' })
      }

      // Buscar en usuario_staff
      const staff = db.prepare('SELECT * FROM usuario_staff WHERE LOWER(email) = ? AND activo = 1').get(input) as any
      if (staff) {
        const user = {
          id: staff.id_usuario,
          username: staff.email.split('@')[0],
          fullName: staff.nombre_completo,
          email: staff.email,
          role: staff.rol,
        }
        return sendJson(
          res,
          200,
          { user },
          { 'Set-Cookie': `smt_session=${staff.id_usuario}; Path=/; HttpOnly; SameSite=Lax` },
        )
      }

      // Buscar en cliente
      const cliente = db.prepare('SELECT * FROM cliente WHERE LOWER(email) = ?').get(input) as any
      if (cliente) {
        const user = {
          id: cliente.id_cliente,
          username: cliente.email.split('@')[0],
          fullName: cliente.nombre_completo,
          email: cliente.email,
          role: 'cliente',
        }
        return sendJson(
          res,
          200,
          { user },
          { 'Set-Cookie': `smt_session=cli_${cliente.id_cliente}; Path=/; HttpOnly; SameSite=Lax` },
        )
      }

      return sendJson(res, 401, { error: 'Credenciales inválidas' })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    try {
      const cookies = parseCookies(req.headers.cookie)
      const session = cookies.smt_session

      if (!session) {
        return sendJson(res, 200, { user: null })
      }

      if (session.startsWith('cli_')) {
        const idCliente = Number(session.replace('cli_', ''))
        const cliente = db.prepare('SELECT * FROM cliente WHERE id_cliente = ?').get(idCliente) as any
        if (cliente) {
          return sendJson(res, 200, {
            user: {
              id: cliente.id_cliente,
              username: cliente.email.split('@')[0],
              fullName: cliente.nombre_completo,
              email: cliente.email,
              role: 'cliente',
            },
          })
        }
      } else {
        const idUsuario = Number(session)
        const staff = db.prepare('SELECT * FROM usuario_staff WHERE id_usuario = ? AND activo = 1').get(idUsuario) as any
        if (staff) {
          return sendJson(res, 200, {
            user: {
              id: staff.id_usuario,
              username: staff.email.split('@')[0],
              fullName: staff.nombre_completo,
              email: staff.email,
              role: staff.rol,
            },
          })
        }
      }

      return sendJson(res, 200, { user: null })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    return sendJson(
      res,
      200,
      { success: true },
      { 'Set-Cookie': 'smt_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' },
    )
  }

  // 5. Recuperación de contraseña — Solicitar reset
  if (url.pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const email = (body.email || '').trim().toLowerCase()

      if (!email || !email.includes('@')) {
        return sendJson(res, 400, { error: 'Email inválido' })
      }

      // Buscar en ambas tablas (staff y cliente)
      const staff = db.prepare('SELECT email FROM usuario_staff WHERE LOWER(email) = ? AND activo = 1').get(email) as any
      const cliente = db.prepare('SELECT email FROM cliente WHERE LOWER(email) = ?').get(email) as any

      if (!staff && !cliente) {
        // Por seguridad, respondemos siempre con éxito para no revelar si el email existe
        return sendJson(res, 200, { success: true })
      }

      // Generar token temporal de 40 chars hex válido por 1 hora
      const raw = Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      const token = raw.slice(0, 40).padEnd(40, '0')
      const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hora

      // Invalidar tokens previos para este email
      db.prepare('DELETE FROM password_reset_tokens WHERE email = ?').run(email)

      // Guardar nuevo token
      db.prepare(
        'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
      ).run(email, token, expiresAt)

      // En producción: enviar email con el token. Por ahora lo imprimimos en consola.
      console.log(`\n🔑 [RESET PASSWORD] Token para ${email}: ${token}\n`)

      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 6. Recuperación de contraseña — Confirmar nuevo password con token
  if (url.pathname === '/api/auth/reset-password' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const token = (body.token || '').trim()
      const newPass = body.newPass || ''
      const confirmPass = body.confirmPass || ''

      if (!token || token.length !== 40) {
        return sendJson(res, 400, { error: 'Token inválido' })
      }
      if (newPass.length < 6) {
        return sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' })
      }
      if (newPass !== confirmPass) {
        return sendJson(res, 400, { error: 'Las contraseñas no coinciden' })
      }

      const row = db
        .prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0')
        .get(token) as any

      if (!row) {
        return sendJson(res, 400, { error: 'Token inválido o ya utilizado' })
      }
      if (Date.now() > row.expires_at) {
        db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token)
        return sendJson(res, 400, { error: 'El token expiró. Solicitá uno nuevo.' })
      }

      const email = row.email

      // Actualizar contraseña — por ahora almacenamos plain (TODO: reemplazar con bcrypt)
      const staffUpd = db
        .prepare('UPDATE usuario_staff SET password_hash = ? WHERE LOWER(email) = ?')
        .run(newPass, email)
      if (staffUpd.changes === 0) {
        db.prepare('UPDATE cliente SET password_hash = ? WHERE LOWER(email) = ?').run(newPass, email)
      }

      // Marcar token como usado
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token)

      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 7. Registro de nuevo cliente (empresa B2B)
  if (url.pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const razonSocial = (body.razonSocial || '').trim()
      const cuit = (body.cuit || '').trim()
      const nombreCompleto = (body.nombreCompleto || '').trim()
      const cargoResponsable = (body.cargoResponsable || '').trim()
      const email = (body.email || '').trim().toLowerCase()
      const telefono = (body.telefono || '').trim()
      const pass = body.pass || ''

      // Validaciones básicas
      if (!razonSocial || razonSocial.length < 3)
        return sendJson(res, 400, { error: 'La razón social es requerida' })
      if (!cuit)
        return sendJson(res, 400, { error: 'El CUIT es requerido' })
      if (!nombreCompleto || nombreCompleto.length < 2)
        return sendJson(res, 400, { error: 'El nombre del responsable es requerido' })
      if (!email || !email.includes('@'))
        return sendJson(res, 400, { error: 'Email inválido' })
      if (!pass || pass.length < 6)
        return sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' })

      // Verificar duplicados
      const emailExists = db.prepare('SELECT id_cliente FROM cliente WHERE LOWER(email) = ?').get(email) as any
      if (emailExists)
        return sendJson(res, 409, { error: 'Ya existe una cuenta con ese email' })

      const cuitExists = db.prepare('SELECT id_cliente FROM cliente WHERE cuit = ?').get(cuit) as any
      if (cuitExists)
        return sendJson(res, 409, { error: 'Ya existe una cuenta con ese CUIT' })

      // Insertar nuevo cliente — TODO: reemplazar pass por bcrypt.hash(pass, 10)
      const stmt = db.prepare(`
        INSERT INTO cliente (razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        razonSocial,
        cuit,
        nombreCompleto,
        cargoResponsable || null,
        email,
        telefono || null,
        pass,
      ) as any

      const newCliente = {
        id: result.lastInsertRowid,
        razonSocial,
        nombreCompleto,
        email,
        role: 'cliente',
      }

      // Establecer sesión igual que en login
      return sendJson(
        res,
        201,
        { success: true, user: newCliente },
        {
          'Set-Cookie': `smt_session=${JSON.stringify({ id: result.lastInsertRowid, role: 'cliente', email })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
        },
      )
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // Endpoint explícito de cierre de sesión para AdminJS
  if (url.pathname === '/admin/logout') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': 'smt_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    })
    res.end(`<!DOCTYPE html><html><body><script>
      try { sessionStorage.clear(); localStorage.clear(); } catch (e) {}
      window.location.href = '/login';
    </script></body></html>`)
    return
  }

  // Panel de AdminJS para Superadmin (server/modules/adminjs/adminjs.config.ts)
  if (url.pathname.startsWith('/admin')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdminJS — Panel de Superadministración SMT Catering</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070e1b; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; box-sizing: border-box; }
    .card { background: #111c30; border: 1px solid #1e2e4a; border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    h1 { color: #38bdf8; font-size: 22px; font-weight: 600; margin: 12px 0 8px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 8px 0; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .meta { margin: 24px 0; padding: 16px; background: #0a1322; border-radius: 8px; border: 1px solid #1a273e; text-align: left; font-size: 13px; color: #cbd5e1; }
    .meta div { margin-bottom: 6px; }
    .meta div:last-child { margin-bottom: 0; }
    .meta span.label { color: #64748b; font-weight: 500; }
    .btn-group { display: flex; gap: 12px; justify-content: center; margin-top: 24px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px; border-radius: 9999px; font-weight: 500; font-size: 14px; border: none; cursor: pointer; text-decoration: none; transition: all 0.15s ease; }
    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }
    .btn-danger { background: rgba(234, 34, 97, 0.15); color: #ff6b8b; border: 1px solid rgba(234, 34, 97, 0.3); }
    .btn-danger:hover { background: rgba(234, 34, 97, 0.25); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>●</span> Superadmin Panel
    </div>
    <h1>SMT Catering — Panel de Administración</h1>
    <p>Has sido redirigido al panel exclusivo de <strong>Superadministrador</strong>.</p>
    <div class="meta">
      <div><span class="label">Módulo:</span> <code>server/modules/adminjs/adminjs.config.ts</code></div>
      <div><span class="label">Ruta raíz:</span> <code>/admin</code></div>
      <div><span class="label">Rol activo:</span> <code>superadmin</code></div>
    </div>
    <div class="btn-group">
      <a class="btn btn-secondary" href="/">Ir a la aplicación</a>
      <button id="logoutBtn" type="button" class="btn btn-danger">Cerrar sesión</button>
    </div>
  </div>
  <script>
    document.getElementById('logoutBtn').addEventListener('click', async function() {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {}
      window.location.href = '/login';
    });
  </script>
</body>
</html>`)
    return
  }

  sendJson(res, 404, { error: 'Ruta no encontrada', path: url.pathname })
})

server.listen(PORT, '0.0.0.0', () => {
  // Crear tabla de tokens de reset si no existe (idempotente, sin depender de db:reset)
  const db = getDatabase()
  ensureResetTokensTable(db)

  console.log(`🚀 SMT Catering Server corriendo en http://localhost:${PORT}`)
  console.log(`📡 Endpoints disponibles en SQLite (MER_v3):`)
  console.log(`   - GET  http://localhost:${PORT}/api/health`)
  console.log(`   - GET  http://localhost:${PORT}/api/tariffs`)
  console.log(`   - PUT  http://localhost:${PORT}/api/tariffs/:id`)
  console.log(`   - POST http://localhost:${PORT}/api/tariffs/bulk`)
  console.log(`   - GET  http://localhost:${PORT}/api/events`)
  console.log(`   - POST http://localhost:${PORT}/api/events`)
  console.log(`   - PATCH http://localhost:${PORT}/api/events/:id`)
  console.log(`   - POST http://localhost:${PORT}/api/auth/login`)
  console.log(`   - GET  http://localhost:${PORT}/api/auth/me`)
  console.log(`   - POST http://localhost:${PORT}/api/auth/logout`)
  console.log(`   - POST http://localhost:${PORT}/api/auth/forgot-password`)
  console.log(`   - POST http://localhost:${PORT}/api/auth/reset-password`)
  console.log(`   - POST http://localhost:${PORT}/api/auth/register`)
})
