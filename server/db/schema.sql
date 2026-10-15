-- =====================================================================
-- SMT Catering — Esquema de Base de Datos SQLite (declarativo)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- 2. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role_id TEXT NOT NULL REFERENCES roles(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Estaciones culinarias
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_guest_cents INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT
);

-- 4. Tarifas y conceptos
CREATE TABLE IF NOT EXISTS tariffs (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('base', 'station', 'extra', 'insurance')),
  price_per_guest_cents INTEGER NOT NULL DEFAULT 0,
  fixed_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 5. Eventos
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_date TEXT NOT NULL, -- YYYY-MM-DD
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL,   -- HH:mm
  duration_hours REAL NOT NULL CHECK(duration_hours <= 3.0),
  location_address TEXT NOT NULL,
  distance_km REAL CHECK(distance_km <= 20.0),
  guests INTEGER NOT NULL CHECK(guests >= 50 AND guests <= 120),
  status TEXT NOT NULL CHECK(status IN ('Presupuestado', 'Señado / Confirmado', 'En Producción', 'Completado', 'Cancelado')),
  payment_status TEXT NOT NULL CHECK(payment_status IN ('SEÑA_PENDIENTE', 'SEÑA_ABONADA', 'SALDO_PENDIENTE', 'TOTALMENTE_SALDADO')),
  total_cents INTEGER NOT NULL,
  deposit_cents INTEGER NOT NULL,
  balance_cents INTEGER NOT NULL,
  insurance_cents INTEGER NOT NULL DEFAULT 0,
  kitchen_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Estaciones contratadas por evento
CREATE TABLE IF NOT EXISTS event_stations (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL REFERENCES stations(id),
  PRIMARY KEY (event_id, station_id)
);

-- 7. Restricciones alimentarias por evento
CREATE TABLE IF NOT EXISTS event_dietary (
  event_id TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  celiacos INTEGER NOT NULL DEFAULT 0,
  vegetarianos INTEGER NOT NULL DEFAULT 0,
  veganos INTEGER NOT NULL DEFAULT 0,
  alergias TEXT,
  otros_detalle TEXT,
  otros_cantidad INTEGER DEFAULT 0
);

-- 8. Pagos y transacciones
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('SEÑA', 'SALDO', 'TOTAL')),
  gateway TEXT, -- 'mercadopago', 'manual', 'transfer'
  gateway_payment_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

