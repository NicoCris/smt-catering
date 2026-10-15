-- =====================================================================
-- SMT Catering — Datos Iniciales (Seed Data)
-- =====================================================================

-- 1. Roles
INSERT OR REPLACE INTO roles (id, description) VALUES
  ('superadmin', 'Administrador General del Sistema y Usuarios'),
  ('admin', 'Administrador Comercial y de Eventos'),
  ('cocina', 'Jefe y Personal de Cocina (solo visualización de comandas)'),
  ('cliente', 'Cliente B2B / Usuario particular');

-- 2. Usuarios base (pass por defecto: 'admin123' / '$2b$10$3euPpxn1O4XjWkC8kY5WwOmN4o4QzE901L9Z6R1L/h1Wq3dZ/pX2K' o similar)
INSERT OR REPLACE INTO users (id, email, username, password_hash, full_name, role_id) VALUES
  ('usr-super', 'superadmin@smtcatering.com', 'superadmin', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'Super Admin', 'superadmin'),
  ('usr-admin', 'admin@smtcatering.com', 'admin', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'Administrador Comercial', 'admin'),
  ('usr-cocina', 'cocina@smtcatering.com', 'cocina', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'Jefe de Cocina', 'cocina'),
  ('usr-cliente', 'cliente@empresa.com', 'cliente', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'Cliente Corporativo Demo', 'cliente');

-- 3. Estaciones culinarias
INSERT OR REPLACE INTO stations (id, name, price_per_guest_cents, description, image_url) VALUES
  ('entradas', 'Entradas', 280000, 'Tablas de fiambres premium, bruschettas artesanales y focaccias', '/images/stations/entradas.jpg'),
  ('pastas', 'Pastas', 350000, 'Sorrentinos de salmón y raviolones con salsas caseras a la vista', '/images/stations/pastas.jpg'),
  ('parrilla', 'Parrilla', 520000, 'Cortes de asado premium, vacío al asador y vegetales grillados', '/images/stations/parrilla.jpg'),
  ('asiatica', 'Cocina Asiática', 460000, 'Wok en vivo de lomo y pollo, dumplings al vapor y gyozas', '/images/stations/asiatica.jpg'),
  ('dulce', 'Estación Dulce', 220000, 'Mesa dulce con minitortas, shots, cascada de chocolate y café', '/images/stations/dulce.jpg');

-- 4. Tarifas base y seguro
INSERT OR REPLACE INTO tariffs (id, label, category, price_per_guest_cents, fixed_cents, is_active) VALUES
  ('tar-base', 'Servicio Base & Logística', 'base', 450000, 0, 1),
  ('tar-seguro', 'Seguro de Evento y Responsabilidad Civil', 'insurance', 0, 4500000, 1);

-- 5. Evento de demostración
INSERT OR REPLACE INTO events (
  id, user_id, client_name, client_email, client_phone,
  event_date, start_time, end_time, duration_hours,
  location_address, distance_km, guests,
  status, payment_status,
  total_cents, deposit_cents, balance_cents, insurance_cents,
  kitchen_notes
) VALUES (
  'EV-1001', 'usr-cliente', 'Tech Solutions S.A.', 'eventos@techsolutions.com', '+54 11 4455-6677',
  '2026-11-20', '19:30', '22:30', 3.0,
  'Av. del Libertador 4400, CABA', 8.5, 75,
  'Señado / Confirmado', 'SEÑA_ABONADA',
  98500000, 49250000, 49250000, 4500000,
  'Servicio formal de bienvenida en recepción. Presentar mesa especial para celíacos en sector este.'
);

-- 6. Estaciones del evento demo
INSERT OR REPLACE INTO event_stations (event_id, station_id) VALUES
  ('EV-1001', 'entradas'),
  ('EV-1001', 'parrilla');

-- 7. Restricciones del evento demo
INSERT OR REPLACE INTO event_dietary (event_id, celiacos, vegetarianos, veganos, alergias, otros_detalle, otros_cantidad) VALUES
  ('EV-1001', 3, 5, 2, 'Almendras y mariscos', 'Menú Kosher', 2);

