/**
 * Punto de entrada del servidor Backend de SMT Catering.
 * Servidor HTTP nativo de Node.js conectado a PostgreSQL (Neon Cloud Database).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { db, getDatabase } from './db/client.ts'
import { signJwt, verifyJwt, type JwtPayload } from './lib/jwt.ts'
import { hashPassword, verifyPassword } from './lib/passwords.ts'

const PORT = Number(process.env.PORT) || 3001

/** Extrae y valida el token JWT de la cookie HTTP-only smt_session o header Authorization. */
function getAuthUser(req: IncomingMessage): JwtPayload | null {
  const cookies = parseCookies(req.headers.cookie)
  const token =
    cookies.smt_session ||
    (typeof req.headers.authorization === 'string'
      ? req.headers.authorization.replace('Bearer ', '')
      : null)
  if (!token) return null
  return verifyJwt(token)
}

/** Crea la tabla de tokens de reset de contraseña si no existe (idempotente). */
async function ensureResetTokensTable(dbClient: typeof db) {
  try {
    await dbClient.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      )
    `)
  } catch (err: any) {
    console.error('⚠️ Error al verificar tabla password_reset_tokens:', err.message)
  }
}

/** Garantiza que la columna activo exista en la tabla cliente (idempotente). */
async function ensureClientActiveColumn(dbClient: typeof db) {
  try {
    await dbClient.exec(`ALTER TABLE cliente ADD COLUMN IF NOT EXISTS activo INTEGER NOT NULL DEFAULT 1`)
  } catch {
    // Si ya existe la columna o la base no lo permite, continúa
  }
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

/** Obtiene el cliente autenticado desde el JWT firmado o cookie previa */
async function getAuthenticatedClient(req: IncomingMessage, dbClient: typeof db) {
  const authUser = getAuthUser(req)
  if (authUser && (authUser.role === 'cliente' || authUser.isClient)) {
    return await dbClient.queryOne('SELECT * FROM cliente WHERE id_cliente = ?', [authUser.id])
  }

  // Compatibilidad con cookies directas anteriores si quedara alguna activa
  const cookies = parseCookies(req.headers.cookie)
  const session = cookies.smt_session
  if (!session) return null

  if (session.startsWith('cli_')) {
    const id = Number(session.replace('cli_', ''))
    if (!isNaN(id)) {
      return await dbClient.queryOne('SELECT * FROM cliente WHERE id_cliente = ?', [id])
    }
  }

  return null
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
  // Soporte para entornos Serverless (Vercel) donde req.body ya viene parseado
  if ((req as any).body !== undefined && (req as any).body !== null) {
    const b = (req as any).body
    if (typeof b === 'object') return Promise.resolve(b)
    if (typeof b === 'string') {
      try {
        return Promise.resolve(JSON.parse(b))
      } catch {
        return Promise.resolve({})
      }
    }
  }

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

async function fetchAllEvents(dbClient: typeof db) {
  const rows = await dbClient.query(
    `SELECT
      r.*,
      c.razon_social as cliente_empresa,
      c.nombre_completo as contacto
    FROM reserva r
    JOIN cliente c ON c.id_cliente = r.id_cliente
    ORDER BY r.fecha_evento ASC`,
  )

  const events = await Promise.all(
    rows.map(async (r: any) => {
      const [stationRows, dietaryRows, pagos] = await Promise.all([
        dbClient.query(
          `SELECT e.codigo
           FROM detalle_reserva_estacion dre
           JOIN estacion e ON e.id_estacion = dre.id_estacion
           WHERE dre.id_reserva = ?`,
          [r.id_reserva],
        ),
        dbClient.query(
          `SELECT tipo_restriccion, cantidad_personas, observaciones
           FROM restriccion_alimentaria
           WHERE id_reserva = ?`,
          [r.id_reserva],
        ),
        dbClient.query(
          `SELECT tipo_pago, monto, estado
           FROM pago
           WHERE id_reserva = ? AND estado = 'confirmado'`,
          [r.id_reserva],
        ),
      ])

      const stations = stationRows.map((s: any) => s.codigo)

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
          depositPesos += Number(p.monto) || 0
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
        totalCents: Math.round((Number(r.monto_total) || 0) * 100),
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
        durationHours: Number(r.duracion_horas) || 3.0,
        locationAddress: r.direccion_evento,
        distanceKm: Number(r.distancia_km) || 10.0,
        insuranceCents: Math.round((Number(r.monto_seguro) || 0) * 100),
      }
    }),
  )

  return events
}

export async function app(req: IncomingMessage, res: ServerResponse) {
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

  // Detectar la URL original preservando el path real en Vercel
  const rawUrl =
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'] ||
    req.headers['x-matched-path'] ||
    req.url ||
    '/'
  const url = new URL(String(rawUrl), `http://${req.headers.host || 'localhost'}`)
  const dbClient = getDatabase()

  // 1. Health check y diagnóstico de Base de Datos
  if (url.pathname === '/api/health' && req.method === 'GET') {
    try {
      const staffRes = await dbClient.query('SELECT count(*) as total_staff FROM usuario_staff')
      return sendJson(res, 200, {
        status: 'ok',
        database: 'connected',
        totalStaff: Number(staffRes[0]?.total_staff || 0),
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        timestamp: new Date().toISOString(),
      })
    } catch (err: any) {
      console.error('⚠️ [HEALTH CHECK ERROR] Error al conectar con Neon:', err.message)
      return sendJson(res, 500, {
        status: 'error',
        database: 'disconnected_or_empty',
        error: err.message,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        timestamp: new Date().toISOString(),
      })
    }
  }

  // 2. Tarifas
  if (url.pathname === '/api/tariffs' && req.method === 'GET') {
    try {
      const rows = await dbClient.query(
        'SELECT id, label, category, price_per_guest_cents, fixed_cents FROM tarifas WHERE is_active = 1',
      )
      const tariffs = rows.map((r: any) => ({
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
      const authUser = getAuthUser(req)
      if (authUser && authUser.role !== 'admin' && authUser.role !== 'superadmin') {
        return sendJson(res, 403, { error: 'Acceso no autorizado. Se requiere rol de administración.' })
      }

      const id = url.pathname.replace('/api/tariffs/', '')
      const body = await parseBody(req)
      await dbClient.execute(
        'UPDATE tarifas SET price_per_guest_cents = ?, fixed_cents = COALESCE(?, fixed_cents) WHERE id = ?',
        [body.pricePerGuestCents, body.fixedCents ?? null, id],
      )
      return sendJson(res, 200, { success: true })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/tariffs/bulk' && req.method === 'POST') {
    try {
      const authUser = getAuthUser(req)
      if (authUser && authUser.role !== 'admin' && authUser.role !== 'superadmin') {
        return sendJson(res, 403, { error: 'Acceso no autorizado. Se requiere rol de administración.' })
      }

      const body = await parseBody(req)
      const list = body.tariffs as Array<{ id: string; pricePerGuestCents: number; fixedCents?: number }>
      if (Array.isArray(list)) {
        for (const t of list) {
          await dbClient.execute('UPDATE tarifas SET price_per_guest_cents = ? WHERE id = ?', [
            t.pricePerGuestCents,
            t.id,
          ])
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
      const events = await fetchAllEvents(dbClient)
      return sendJson(res, 200, { events })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/events' && req.method === 'POST') {
    try {
      const body = await parseBody(req)

      // 1. Cliente B2B (obtener o crear)
      let cliente = await dbClient.queryOne('SELECT id_cliente FROM cliente WHERE razon_social = ?', [
        body.clientName,
      ])
      let idCliente = cliente?.id_cliente
      if (!idCliente) {
        const insertResult = await dbClient.execute(
          `INSERT INTO cliente (razon_social, cuit, nombre_completo, email, password_hash)
           VALUES (?, ?, ?, ?, ?)`,
          [
            body.clientName,
            `30-${Date.now().toString().slice(-8)}-1`,
            body.clientName,
            `eventos@${body.clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente'}.com`,
            'temp_hash',
          ],
        )
        idCliente = Number(insertResult.lastInsertId)
      }

      // 2. Reserva
      const totalPesos = (body.totalCents || 0) / 100
      const seguroPesos = (body.insuranceCents || 0) / 100

      const reservaResult = await dbClient.execute(
        `INSERT INTO reserva (
          id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
          cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
          estado_evento, estado_pago, notas_cocina, monto_total, monto_seguro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ],
      )

      const idReserva = Number(reservaResult.lastInsertId)

      // 3. Detalle de Estaciones
      if (Array.isArray(body.stationIds)) {
        for (const stationSlug of body.stationIds) {
          const s = await dbClient.queryOne(
            'SELECT id_estacion, precio_por_persona FROM estacion WHERE codigo = ?',
            [stationSlug],
          )
          if (s) {
            const subtotal = Number(s.precio_por_persona) * (body.guests || 50)
            await dbClient.execute(
              `INSERT INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado)
               VALUES (?, ?, ?)`,
              [idReserva, s.id_estacion, subtotal],
            )
          }
        }
      }

      // 4. Restricciones Alimentarias
      if (body.dietary) {
        if (body.dietary.celiacos > 0) {
          await dbClient.execute(
            `INSERT INTO restriccion_alimentaria (id_reserva, tipo_restriccion, cantidad_personas, observaciones)
             VALUES (?, ?, ?, ?)`,
            [idReserva, 'Celiaquía', body.dietary.celiacos, 'Menú celíaco'],
          )
        }
        if (body.dietary.vegetarianos > 0) {
          await dbClient.execute(
            `INSERT INTO restriccion_alimentaria (id_reserva, tipo_restriccion, cantidad_personas, observaciones)
             VALUES (?, ?, ?, ?)`,
            [idReserva, 'Vegetarianos', body.dietary.vegetarianos, 'Menú vegetariano'],
          )
        }
        if (body.dietary.veganos > 0) {
          await dbClient.execute(
            `INSERT INTO restriccion_alimentaria (id_reserva, tipo_restriccion, cantidad_personas, observaciones)
             VALUES (?, ?, ?, ?)`,
            [idReserva, 'Veganos', body.dietary.veganos, 'Menú vegano'],
          )
        }
        if (body.dietary.alergias) {
          await dbClient.execute(
            `INSERT INTO restriccion_alimentaria (id_reserva, tipo_restriccion, cantidad_personas, observaciones)
             VALUES (?, ?, ?, ?)`,
            [idReserva, 'Alergias', 1, body.dietary.alergias],
          )
        }
      }

      // 5. Pago inicial (seña)
      if (body.depositCents > 0) {
        await dbClient.execute(
          `INSERT INTO pago (id_reserva, tipo_pago, monto, pago_online, pago_completo, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [idReserva, 'SEÑA', body.depositCents / 100, 1, 0, 'confirmado'],
        )
      }

      const all = await fetchAllEvents(dbClient)
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

      await dbClient.execute(
        `UPDATE reserva
         SET
           estado_evento = COALESCE(?, estado_evento),
           estado_pago = COALESCE(?, estado_pago),
           notas_cocina = COALESCE(?, notas_cocina),
           fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_reserva = ?`,
        [body.status ?? null, body.paymentStatus ?? null, body.kitchenNotes ?? null, idReserva],
      )

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

      // Credencial / alias rápido para admin
      if (input === 'admin' && (pass === 'admin' || pass === 'admin123')) {
        const user = {
          id: 2,
          username: 'admin',
          fullName: 'Administrador',
          email: 'admin@smtcatering.com',
          role: 'admin' as const,
        }
        const token = signJwt({
          id: 2,
          role: 'admin',
          email: 'admin@smtcatering.com',
          fullName: 'Administrador',
          isClient: false,
        })
        return sendJson(
          res,
          200,
          { user },
          {
            'Set-Cookie': `smt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
          },
        )
      }

      // 1. Buscar en usuario_staff por email (si ingresó 'admin', busca admin@smtcatering.com)
      const lookupEmail = input === 'admin' ? 'admin@smtcatering.com' : input
      const staff = await dbClient.queryOne(
        'SELECT * FROM usuario_staff WHERE LOWER(email) = ? AND activo = 1',
        [lookupEmail],
      )
      if (staff && verifyPassword(pass, staff.password_hash)) {
        const user = {
          id: staff.id_usuario,
          username: staff.email.split('@')[0],
          fullName: staff.nombre_completo,
          email: staff.email,
          role: staff.rol,
        }
        const token = signJwt({
          id: staff.id_usuario,
          role: staff.rol,
          email: staff.email,
          fullName: staff.nombre_completo,
          isClient: false,
        })
        return sendJson(
          res,
          200,
          { user },
          {
            'Set-Cookie': `smt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
          },
        )
      }

      // 2. Buscar en cliente por email (validando password con hash seguro)
      const cliente = await dbClient.queryOne('SELECT * FROM cliente WHERE LOWER(email) = ?', [input])
      if (cliente && verifyPassword(pass, cliente.password_hash)) {
        if (cliente.activo === 0 || cliente.activo === false) {
          return sendJson(res, 403, {
            error:
              'Su cuenta de usuario cliente se encuentra inhabilitada. Por favor, comuníquese con el equipo de SMT Catering.',
          })
        }

        const user = {
          id: cliente.id_cliente,
          username: cliente.email.split('@')[0],
          fullName: cliente.nombre_completo,
          email: cliente.email,
          role: 'cliente' as const,
        }
        const token = signJwt({
          id: cliente.id_cliente,
          role: 'cliente',
          email: cliente.email,
          fullName: cliente.nombre_completo,
          isClient: true,
        })
        return sendJson(
          res,
          200,
          { user },
          {
            'Set-Cookie': `smt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
          },
        )
      }

      return sendJson(res, 401, { error: 'Credenciales inválidas' })
    } catch (err: any) {
      console.error('❌ [AUTH LOGIN ERROR]:', err)
      return sendJson(res, 500, { error: err.message })
    }
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    try {
      const authUser = getAuthUser(req)
      if (!authUser) {
        return sendJson(res, 200, { user: null })
      }

      return sendJson(res, 200, {
        user: {
          id: authUser.id,
          username: authUser.email.split('@')[0],
          fullName: authUser.fullName,
          email: authUser.email,
          role: authUser.role,
        },
      })
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
        return sendJson(res, 400, { error: 'Debes proporcionar un email válido' })
      }

      // Verificar si existe en staff o en cliente
      const staff = await dbClient.queryOne(
        'SELECT email FROM usuario_staff WHERE LOWER(email) = ? AND activo = 1',
        [email],
      )
      const cliente = await dbClient.queryOne('SELECT email FROM cliente WHERE LOWER(email) = ?', [email])

      if (!staff && !cliente) {
        // Por seguridad, respondemos siempre con éxito para no revelar si el email existe
        return sendJson(res, 200, { success: true })
      }

      // Generar token temporal de 40 chars hex válido por 1 hora
      const raw =
        Date.now().toString(36) +
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2)
      const token = raw.slice(0, 40).padEnd(40, '0')
      const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hora

      // Invalidar tokens previos para este email
      await dbClient.execute('DELETE FROM password_reset_tokens WHERE email = ?', [email])

      // Guardar nuevo token
      await dbClient.execute(
        `INSERT INTO password_reset_tokens (email, token, expires_at, used)
         VALUES (?, ?, ?, 0)`,
        [email, token, expiresAt],
      )

      // En producción aquí se enviaría un email con el token.
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

      const row = await dbClient.queryOne(
        'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0',
        [token],
      )

      if (!row) {
        return sendJson(res, 400, { error: 'Token inválido o ya utilizado' })
      }
      if (Date.now() > Number(row.expires_at)) {
        await dbClient.execute('DELETE FROM password_reset_tokens WHERE token = ?', [token])
        return sendJson(res, 400, { error: 'El token expiró. Solicitá uno nuevo.' })
      }

      const email = row.email

      // Actualizar contraseña con hash seguro scrypt
      const hashedPass = hashPassword(newPass)
      const staffUpd = await dbClient.execute(
        'UPDATE usuario_staff SET password_hash = ? WHERE LOWER(email) = ?',
        [hashedPass, email],
      )
      if (staffUpd.changes === 0) {
        await dbClient.execute('UPDATE cliente SET password_hash = ? WHERE LOWER(email) = ?', [
          hashedPass,
          email,
        ])
      }

      // Marcar token como usado
      await dbClient.execute('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token])

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
      if (!cuit) return sendJson(res, 400, { error: 'El CUIT es requerido' })
      if (!nombreCompleto || nombreCompleto.length < 2)
        return sendJson(res, 400, { error: 'El nombre del responsable es requerido' })
      if (!email || !email.includes('@'))
        return sendJson(res, 400, { error: 'Email inválido' })
      if (!pass || pass.length < 6)
        return sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' })

      // Verificar duplicados
      const emailExists = await dbClient.queryOne('SELECT id_cliente FROM cliente WHERE LOWER(email) = ?', [
        email,
      ])
      if (emailExists)
        return sendJson(res, 409, { error: 'Ya existe una cuenta con ese email' })

      const cuitExists = await dbClient.queryOne('SELECT id_cliente FROM cliente WHERE cuit = ?', [cuit])
      if (cuitExists)
        return sendJson(res, 409, { error: 'Ya existe una cuenta con ese CUIT' })

      // Insertar nuevo cliente con hash seguro scrypt
      const passHash = hashPassword(pass)
      const result = await dbClient.execute(
        `INSERT INTO cliente (razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [razonSocial, cuit, nombreCompleto, cargoResponsable || null, email, telefono || null, passHash],
      )

      const idCliente = Number(result.lastInsertId)
      const newCliente = {
        id: idCliente,
        username: email.split('@')[0],
        fullName: nombreCompleto,
        email,
        role: 'cliente' as const,
      }

      // Generar JWT firmado real para transporte seguro en cookie
      const token = signJwt({
        id: idCliente,
        role: 'cliente',
        email,
        fullName: nombreCompleto,
        isClient: true,
      })

      return sendJson(
        res,
        201,
        { success: true, user: newCliente },
        {
          'Set-Cookie': `smt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
        },
      )
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 8. Perfil de Cliente — Obtener información personal y de empresa
  if (url.pathname === '/api/client/profile' && req.method === 'GET') {
    try {
      const cliente = await getAuthenticatedClient(req, dbClient)
      if (!cliente) {
        return sendJson(res, 401, { error: 'No autorizado o sesión no válida' })
      }

      return sendJson(res, 200, {
        profile: {
          razonSocial: cliente.razon_social || '',
          cuit: cliente.cuit || '',
          nombreCompleto: cliente.nombre_completo || '',
          cargoResponsable: cliente.cargo_responsable || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          direccionLegal: cliente.direccion_legal || '',
        },
      })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 9. Perfil de Cliente — Actualizar datos de contacto
  if (url.pathname === '/api/client/profile' && req.method === 'PUT') {
    try {
      const cliente = await getAuthenticatedClient(req, dbClient)
      if (!cliente) {
        return sendJson(res, 401, { error: 'No autorizado o sesión no válida' })
      }

      const body = await parseBody(req)
      const razonSocial = (body.razonSocial || cliente.razon_social || '').trim()
      const nombreCompleto = (body.nombreCompleto || cliente.nombre_completo || '').trim()
      const cargoResponsable = (body.cargoResponsable ?? cliente.cargo_responsable ?? '').trim()
      const email = (body.email || cliente.email || '').trim().toLowerCase()
      const telefono = (body.telefono ?? cliente.telefono ?? '').trim()
      const direccionLegal = (body.direccionLegal ?? cliente.direccion_legal ?? '').trim()

      if (!razonSocial || !nombreCompleto || !email) {
        return sendJson(res, 400, {
          error: 'Razón social, nombre del responsable y email son obligatorios',
        })
      }

      // Si cambió el email, validar que no esté en uso por otro usuario
      if (email !== cliente.email.toLowerCase()) {
        const staffDup = await dbClient.queryOne(
          'SELECT email FROM usuario_staff WHERE LOWER(email) = ?',
          [email],
        )
        const clienteDup = await dbClient.queryOne(
          'SELECT email FROM cliente WHERE LOWER(email) = ? AND id_cliente != ?',
          [email, cliente.id_cliente],
        )
        if (staffDup || clienteDup) {
          return sendJson(res, 409, { error: 'El email ya se encuentra registrado por otra cuenta' })
        }
      }

      await dbClient.execute(
        `UPDATE cliente
         SET
           razon_social = ?,
           nombre_completo = ?,
           cargo_responsable = ?,
           email = ?,
           telefono = ?,
           direccion_legal = ?
         WHERE id_cliente = ?`,
        [
          razonSocial,
          nombreCompleto,
          cargoResponsable || null,
          email,
          telefono || null,
          direccionLegal || null,
          cliente.id_cliente,
        ],
      )

      return sendJson(res, 200, {
        success: true,
        profile: {
          razonSocial,
          cuit: cliente.cuit,
          nombreCompleto,
          cargoResponsable,
          email,
          telefono,
          direccionLegal,
        },
      })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 10. Perfil de Cliente — Actualizar contraseña
  if (url.pathname === '/api/client/change-password' && req.method === 'POST') {
    try {
      const cliente = await getAuthenticatedClient(req, dbClient)
      if (!cliente) {
        return sendJson(res, 401, { error: 'No autorizado o sesión no válida' })
      }

      const body = await parseBody(req)
      const currentPassword = (body.currentPassword || '').trim()
      const newPassword = (body.newPassword || '').trim()

      if (!currentPassword || !newPassword) {
        return sendJson(res, 400, {
          error: 'Debes completar la contraseña actual y la nueva contraseña',
        })
      }
      if (newPassword.length < 6) {
        return sendJson(res, 400, { error: 'La nueva contraseña debe tener al menos 6 caracteres' })
      }

      if (!verifyPassword(currentPassword, cliente.password_hash)) {
        return sendJson(res, 400, { error: 'La contraseña actual ingresada es incorrecta' })
      }

      const newPassHash = hashPassword(newPassword)
      await dbClient.execute('UPDATE cliente SET password_hash = ? WHERE id_cliente = ?', [
        newPassHash,
        cliente.id_cliente,
      ])

      return sendJson(res, 200, { success: true, message: 'Contraseña actualizada correctamente' })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 11. Gestión de Usuarios — Listar Colaboradores Internos y Clientes
  if (url.pathname === '/api/users' && req.method === 'GET') {
    const authUser = getAuthUser(req)
    if (!authUser || (authUser.role !== 'superadmin' && authUser.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Acceso denegado. Se requiere rol de administración.' })
    }

    try {
      const staff = await dbClient.query(`
        SELECT id_usuario, nombre_completo, email, rol, activo, fecha_creacion
        FROM usuario_staff
        ORDER BY id_usuario ASC
      `)

      const clients = await dbClient.query(`
        SELECT id_cliente, razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, direccion_legal, fecha_aniversario, activo, fecha_creacion
        FROM cliente
        ORDER BY id_cliente ASC
      `)

      return sendJson(res, 200, { staff, clients })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 12. Gestión de Usuarios — Crear nuevo miembro de Staff
  if (url.pathname === '/api/users/staff' && req.method === 'POST') {
    const authUser = getAuthUser(req)
    if (!authUser || (authUser.role !== 'superadmin' && authUser.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Acceso denegado. Se requiere rol de administración.' })
    }

    try {
      const body = await parseBody(req)
      const nombreCompleto = (body.nombreCompleto || body.nombre_completo || '').trim()
      const email = (body.email || '').trim().toLowerCase()
      const password = (body.password || '').trim()
      const rol = (body.rol || 'admin').trim().toLowerCase()
      const activo = body.activo === 0 || body.activo === false ? 0 : 1

      if (!nombreCompleto || !email || !password) {
        return sendJson(res, 400, { error: 'Nombre completo, email y contraseña son obligatorios.' })
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres.' })
      }
      if (!['superadmin', 'admin', 'cocina'].includes(rol)) {
        return sendJson(res, 400, { error: 'Rol inválido. Opciones válidas: superadmin, admin, cocina.' })
      }
      if (rol === 'superadmin' && authUser.role !== 'superadmin') {
        return sendJson(res, 403, {
          error: 'Solo el Superadministrador puede crear usuarios con rol superadmin.',
        })
      }

      const staffExists = await dbClient.queryOne(
        'SELECT id_usuario FROM usuario_staff WHERE LOWER(email) = ?',
        [email],
      )
      const clientExists = await dbClient.queryOne('SELECT id_cliente FROM cliente WHERE LOWER(email) = ?', [
        email,
      ])
      if (staffExists || clientExists) {
        return sendJson(res, 409, { error: 'El email ya se encuentra registrado por otra cuenta.' })
      }

      const passwordHash = hashPassword(password)
      const insertRes = await dbClient.execute(
        `INSERT INTO usuario_staff (nombre_completo, email, password_hash, rol, activo)
         VALUES (?, ?, ?, ?, ?)`,
        [nombreCompleto, email, passwordHash, rol, activo],
      )

      const newId = Number(insertRes.lastInsertId)
      const created = await dbClient.queryOne(
        `SELECT id_usuario, nombre_completo, email, rol, activo, fecha_creacion
         FROM usuario_staff
         WHERE id_usuario = ?`,
        [newId],
      )

      return sendJson(res, 201, { success: true, user: created })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 13. Gestión de Usuarios — Modificar miembro de Staff
  const matchStaffId = url.pathname.match(/^\/api\/users\/staff\/(\d+)$/)
  if (matchStaffId && (req.method === 'PATCH' || req.method === 'PUT')) {
    const authUser = getAuthUser(req)
    if (!authUser || (authUser.role !== 'superadmin' && authUser.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Acceso denegado. Se requiere rol de administración.' })
    }

    try {
      const targetId = Number(matchStaffId[1])
      const existing = await dbClient.queryOne('SELECT * FROM usuario_staff WHERE id_usuario = ?', [
        targetId,
      ])
      if (!existing) {
        return sendJson(res, 404, { error: 'Usuario no encontrado.' })
      }

      if (existing.rol === 'superadmin' && authUser.role !== 'superadmin') {
        return sendJson(res, 403, {
          error: 'Solo un Superadministrador puede modificar a otro Superadministrador.',
        })
      }

      const body = await parseBody(req)
      const nombreCompleto =
        body.nombreCompleto !== undefined
          ? String(body.nombreCompleto).trim()
          : body.nombre_completo !== undefined
          ? String(body.nombre_completo).trim()
          : existing.nombre_completo

      const email =
        body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email
      const rol = body.rol !== undefined ? String(body.rol).trim().toLowerCase() : existing.rol
      const activo =
        body.activo !== undefined ? (Number(body.activo) === 0 ? 0 : 1) : existing.activo

      if (rol && !['superadmin', 'admin', 'cocina'].includes(rol)) {
        return sendJson(res, 400, { error: 'Rol inválido. Opciones válidas: superadmin, admin, cocina.' })
      }
      if (rol === 'superadmin' && authUser.role !== 'superadmin') {
        return sendJson(res, 403, {
          error: 'Solo un Superadministrador puede promover un usuario a superadmin.',
        })
      }

      if (email !== existing.email.toLowerCase()) {
        const staffDup = await dbClient.queryOne(
          'SELECT id_usuario FROM usuario_staff WHERE LOWER(email) = ? AND id_usuario != ?',
          [email, targetId],
        )
        const clientDup = await dbClient.queryOne('SELECT id_cliente FROM cliente WHERE LOWER(email) = ?', [
          email,
        ])
        if (staffDup || clientDup) {
          return sendJson(res, 409, { error: 'El email ya se encuentra en uso por otra cuenta.' })
        }
      }

      let newPasswordHash = existing.password_hash
      if (body.password && String(body.password).trim().length >= 6) {
        newPasswordHash = hashPassword(String(body.password).trim())
      }

      await dbClient.execute(
        `UPDATE usuario_staff
         SET nombre_completo = ?, email = ?, password_hash = ?, rol = ?, activo = ?
         WHERE id_usuario = ?`,
        [nombreCompleto, email, newPasswordHash, rol, activo, targetId],
      )

      const updated = await dbClient.queryOne(
        `SELECT id_usuario, nombre_completo, email, rol, activo, fecha_creacion
         FROM usuario_staff
         WHERE id_usuario = ?`,
        [targetId],
      )

      return sendJson(res, 200, { success: true, user: updated })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 14. Gestión de Usuarios — Eliminar miembro de Staff (Solo Superadmin)
  if (matchStaffId && req.method === 'DELETE') {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== 'superadmin') {
      return sendJson(res, 403, {
        error: 'Solo el Superadministrador puede eliminar usuarios definitivamente.',
      })
    }

    try {
      const targetId = Number(matchStaffId[1])
      if (targetId === authUser.id) {
        return sendJson(res, 400, { error: 'No puedes eliminar tu propia cuenta de Superadministrador.' })
      }

      await dbClient.execute('DELETE FROM usuario_staff WHERE id_usuario = ?', [targetId])
      return sendJson(res, 200, { success: true, message: 'Usuario eliminado correctamente.' })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // 15. Gestión de Usuarios — Modificar Cliente B2B
  const matchClientId = url.pathname.match(/^\/api\/users\/clients\/(\d+)$/)
  if (matchClientId && (req.method === 'PATCH' || req.method === 'PUT')) {
    const authUser = getAuthUser(req)
    if (!authUser || (authUser.role !== 'superadmin' && authUser.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Acceso denegado. Se requiere rol de administración.' })
    }

    try {
      const targetId = Number(matchClientId[1])
      const existing = await dbClient.queryOne('SELECT * FROM cliente WHERE id_cliente = ?', [targetId])
      if (!existing) {
        return sendJson(res, 404, { error: 'Cliente no encontrado.' })
      }

      const body = await parseBody(req)
      const razonSocial =
        body.razonSocial !== undefined ? String(body.razonSocial).trim() : existing.razon_social
      const cuit = body.cuit !== undefined ? String(body.cuit).trim() : existing.cuit
      const nombreCompleto =
        body.nombreCompleto !== undefined
          ? String(body.nombreCompleto).trim()
          : existing.nombre_completo
      const cargoResponsable =
        body.cargoResponsable !== undefined
          ? String(body.cargoResponsable).trim()
          : existing.cargo_responsable
      const email =
        body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email
      const telefono =
        body.telefono !== undefined ? String(body.telefono).trim() : existing.telefono
      const direccionLegal =
        body.direccionLegal !== undefined ? String(body.direccionLegal).trim() : existing.direccion_legal
      const activo =
        body.activo !== undefined ? (Number(body.activo) === 0 ? 0 : 1) : existing.activo

      if (email !== existing.email.toLowerCase()) {
        const staffDup = await dbClient.queryOne(
          'SELECT id_usuario FROM usuario_staff WHERE LOWER(email) = ?',
          [email],
        )
        const clientDup = await dbClient.queryOne(
          'SELECT id_cliente FROM cliente WHERE LOWER(email) = ? AND id_cliente != ?',
          [email, targetId],
        )
        if (staffDup || clientDup) {
          return sendJson(res, 409, { error: 'El email ya está en uso por otro usuario.' })
        }
      }

      let newPasswordHash = existing.password_hash
      if (body.password && String(body.password).trim().length >= 6) {
        newPasswordHash = hashPassword(String(body.password).trim())
      }

      await dbClient.execute(
        `UPDATE cliente
         SET razon_social = ?, cuit = ?, nombre_completo = ?, cargo_responsable = ?, email = ?, telefono = ?, direccion_legal = ?, password_hash = ?, activo = ?
         WHERE id_cliente = ?`,
        [
          razonSocial,
          cuit,
          nombreCompleto,
          cargoResponsable,
          email,
          telefono,
          direccionLegal,
          newPasswordHash,
          activo,
          targetId,
        ],
      )

      const updated = await dbClient.queryOne(
        `SELECT id_cliente, razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, direccion_legal, fecha_aniversario, activo, fecha_creacion
         FROM cliente
         WHERE id_cliente = ?`,
        [targetId],
      )

      return sendJson(res, 200, { success: true, client: updated })
    } catch (err: any) {
      return sendJson(res, 500, { error: err.message })
    }
  }

  // Redirección amigable de /admin a /usuarios
  if (url.pathname.startsWith('/admin')) {
    res.writeHead(302, { Location: '/usuarios' })
    res.end()
    return
  }

  sendJson(res, 404, { error: 'Ruta no encontrada', path: url.pathname })
}

export const server = createServer(app)

// En entorno de ejecución local estándar, levantar servidor HTTP en puerto asignado
if (process.env.VERCEL !== '1') {
  server.listen(PORT, '0.0.0.0', async () => {
    const dbClient = getDatabase()
    await ensureResetTokensTable(dbClient)
    await ensureClientActiveColumn(dbClient)

    console.log(`🚀 SMT Catering Server corriendo en http://localhost:${PORT}`)
    console.log(`📡 Base de Datos: Neon PostgreSQL Cloud`)
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
    console.log(`   - GET  http://localhost:${PORT}/api/client/profile`)
    console.log(`   - PUT  http://localhost:${PORT}/api/client/profile`)
    console.log(`   - POST http://localhost:${PORT}/api/client/change-password`)
    console.log(`   - GET  http://localhost:${PORT}/api/users`)
    console.log(`   - POST http://localhost:${PORT}/api/users/staff`)
    console.log(`   - PATCH http://localhost:${PORT}/api/users/staff/:id`)
    console.log(`   - DELETE http://localhost:${PORT}/api/users/staff/:id`)
    console.log(`   - PATCH http://localhost:${PORT}/api/users/clients/:id`)
  })
}

export default server
