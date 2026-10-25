-- =====================================================================
-- SMT Catering — Esquema de Base de Datos SQLite (Basado en MER_v3.xml)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. CLIENTE (EMPRESA B2B)
CREATE TABLE IF NOT EXISTS cliente (
  id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
  razon_social VARCHAR(80) NOT NULL,
  cuit VARCHAR(15) UNIQUE NOT NULL,
  nombre_completo VARCHAR(50) NOT NULL,
  cargo_responsable VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  direccion_legal VARCHAR(100),
  fecha_aniversario DATE,
  password_hash VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USUARIO (STAFF INTERNO: admin, cocina, superadmin)
CREATE TABLE IF NOT EXISTS usuario_staff (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'cocina')),
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ESTACION / ISLA GASTRONOMICA
CREATE TABLE IF NOT EXISTS estacion (
  id_estacion INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  tipo_comida TEXT NOT NULL DEFAULT 'salado', -- salado / dulce
  descripcion VARCHAR(150),
  precio_por_persona DECIMAL(10,2) NOT NULL
);

-- 4. RESERVA DE EVENTO
CREATE TABLE IF NOT EXISTS reserva (
  id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
  fecha_evento DATE NOT NULL,                   -- Viernes, Sábado o Domingo
  hora_inicio TIME NOT NULL,                    -- Entre 19:00 y 21:00 hs
  hora_fin TIME NOT NULL,                       -- Hasta las 00:00 hs
  duracion_horas REAL NOT NULL CHECK(duracion_horas <= 3.0),
  cantidad_invitados INTEGER NOT NULL CHECK(cantidad_invitados >= 50 AND cantidad_invitados <= 120),
  direccion_evento VARCHAR(150) NOT NULL,
  distancia_km DECIMAL(4,2) CHECK(distancia_km <= 20.0),
  evento_cancelado INTEGER NOT NULL DEFAULT 0,  -- 0: Activo, 1: Cancelado
  estado_evento TEXT NOT NULL DEFAULT 'Presupuestado',
  estado_pago TEXT NOT NULL DEFAULT 'SEÑA_PENDIENTE',
  notas_cocina TEXT DEFAULT '',
  monto_total DECIMAL(10,2) NOT NULL,
  monto_seguro DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(50)
);

-- 5. DETALLE DE ESTACIONES POR RESERVA (Junction table)
CREATE TABLE IF NOT EXISTS detalle_reserva_estacion (
  id_reserva INTEGER NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
  id_estacion INTEGER NOT NULL REFERENCES estacion(id_estacion),
  subtotal_calculado DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_reserva, id_estacion)
);

-- 6. RESTRICCIONES ALIMENTARIAS (Normalizada 1 a N)
CREATE TABLE IF NOT EXISTS restriccion_alimentaria (
  id_restriccion INTEGER PRIMARY KEY AUTOINCREMENT,
  id_reserva INTEGER NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
  tipo_restriccion VARCHAR(50) NOT NULL,       -- Celiacos, Vegetarianos, Veganos, Alergias, Otros
  cantidad_personas INTEGER NOT NULL DEFAULT 1,
  observaciones VARCHAR(100)
);

-- 7. PAGOS Y LIQUIDACIONES
CREATE TABLE IF NOT EXISTS pago (
  id_pago INTEGER PRIMARY KEY AUTOINCREMENT,
  id_reserva INTEGER NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
  tipo_pago VARCHAR(25) NOT NULL CHECK(tipo_pago IN ('SEÑA', 'SALDO', 'TOTAL')),
  monto DECIMAL(10,2) NOT NULL,
  pago_online INTEGER NOT NULL DEFAULT 1,
  pago_completo INTEGER NOT NULL DEFAULT 0,
  fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado TEXT NOT NULL CHECK(estado IN ('pendiente', 'confirmado', 'cancelado'))
);

-- 8. COMANDAS DE PRODUCCION (Desdobladas por estación/brigada de cocina)
CREATE TABLE IF NOT EXISTS comanda_produccion (
  id_comanda INTEGER PRIMARY KEY AUTOINCREMENT,
  id_reserva INTEGER NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
  id_estacion INTEGER NOT NULL REFERENCES estacion(id_estacion),
  observaciones TEXT,                          -- Contenido estructurado JSON
  fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP,
  actualizado_por VARCHAR(50)
);

-- 9. TARIFAS BASE Y SEGURO (Configuración general del cotizador)
CREATE TABLE IF NOT EXISTS tarifas (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('base', 'station', 'extra', 'insurance')),
  price_per_guest_cents INTEGER NOT NULL DEFAULT 0,
  fixed_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);
