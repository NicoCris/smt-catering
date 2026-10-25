-- =====================================================================
-- SMT Catering — Datos Iniciales y Smoke Test Data (seed.sql)
-- =====================================================================

-- 1. USUARIOS STAFF (Contraseña por defecto hasheada: 'admin123')
INSERT OR REPLACE INTO usuario_staff (id_usuario, nombre_completo, email, password_hash, rol, activo) VALUES
  (1, 'Super Administrador', 'superadmin@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'superadmin', 1),
  (2, 'Coordinador Comercial', 'admin@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'admin', 1),
  (3, 'Chef Ejecutivo de Cocina', 'cocina@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'cocina', 1);

-- 2. CLIENTES CORPORATIVOS (Empresas B2B)
INSERT OR REPLACE INTO cliente (id_cliente, razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, direccion_legal, fecha_aniversario, password_hash) VALUES
  (1, 'Tech Solutions S.A.', '30-71234567-9', 'Martín Rodríguez', 'Gerente de Operaciones', 'eventos@techsolutions.com', '+54 11 4555-0101', 'Av. del Libertador 4400, CABA', '2015-10-15', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (2, 'Finanzas Globales Corp', '30-68912345-4', 'Valeria Gómez', 'Directora de RRHH', 'rrhh@finanzasglobales.com', '+54 11 4888-2233', 'Reconquista 650, CABA', '2010-05-20', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (3, 'Laboratorios Río de la Plata', '33-54321987-9', 'Esteban Morales', 'Gerente Comercial', 'eventos@laboratoriosrio.com', '+54 11 4777-3344', 'Av. Santa Fe 3200, CABA', '2005-11-10', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (4, 'Innova Digital Studio', '30-76543210-2', 'Lucía Rossi', 'Chief People Officer', 'lucia@innovastudio.com', '+54 11 4999-5566', 'Humboldt 1900, Palermo, CABA', '2020-03-01', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi');

-- 3. ESTACIONES / ISLAS GASTRONOMICAS
INSERT OR REPLACE INTO estacion (id_estacion, nombre, tipo_comida, descripcion, precio_por_persona) VALUES
  (1, 'Entradas Gourmet', 'salado', 'Tablas de fiambres premium, quesos madurados, bruschettas y focaccias artesanales', 2800.00),
  (2, 'Pastas Rellenas Artesanales', 'salado', 'Sorrentinos de salmón y raviolones con salsas caseras preparadas a la vista', 3500.00),
  (3, 'Parrilla Premium al Asador', 'salado', 'Cortes seleccionados de asado, vacío criollo, provoletas y vegetales grillados', 5200.00),
  (4, 'Cocina Asiática & Wok en Vivo', 'salado', 'Salteados de lomo y pollo al wok, dumplings al vapor y gyozas tradicionales', 4600.00),
  (5, 'Estación Dulce & Chocolates', 'dulce', 'Mesa dulce con minitortas, shots gourmet, cascada de chocolate belga y café', 2200.00);

-- 4. TARIFAS BASE DEL COTIZADOR Y SEGURO
INSERT OR REPLACE INTO tarifas (id, label, category, price_per_guest_cents, fixed_cents, is_active) VALUES
  ('tar-base', 'Servicio Base, Vajilla y Logística', 'base', 450000, 0, 1),
  ('entradas', 'Entradas Gourmet', 'station', 280000, 0, 1),
  ('pastas', 'Pastas Rellenas', 'station', 350000, 0, 1),
  ('parrilla', 'Parrilla Premium', 'station', 520000, 0, 1),
  ('asiatica', 'Cocina Asiática', 'station', 460000, 0, 1),
  ('dulce', 'Estación Dulce', 'station', 220000, 0, 1),
  ('tar-seguro', 'Seguro de Evento y Responsabilidad Civil', 'insurance', 0, 4500000, 1);

-- 5. RESERVAS DE PRUEBA (SMOKE DATA REALISTA)

-- Reserva 1: Evento Pasado, Concluido y 100% Saldado (Viernes)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  monto_total, monto_seguro, fecha_creacion, fecha_actualizacion, actualizado_por
) VALUES (
  1, 1, '2026-10-09', '19:30', '22:30', 3.0,
  80, 'Av. Figueroa Alcorta 5500, CABA', 9.50, 0,
  1221000.00, 45000.00, '2026-09-01 10:00:00', '2026-10-09 23:00:00', 'admin'
);

-- Reserva 2: Evento Futuro en Producción (Sábado) - Seña 50% abonada, saldo pendiente
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  monto_total, monto_seguro, fecha_creacion, fecha_actualizacion, actualizado_por
) VALUES (
  2, 2, '2026-11-14', '20:00', '23:00', 3.0,
  100, 'Costa Salguero, Pabellón 2, CABA', 11.20, 0,
  1805000.00, 45000.00, '2026-10-15 14:30:00', '2026-10-16 11:20:00', 'admin'
);

-- Reserva 3: Evento Concurrente A en la misma fecha (Sábado, 55 invitados <= 60)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  monto_total, monto_seguro, fecha_creacion, fecha_actualizacion, actualizado_por
) VALUES (
  3, 3, '2026-11-21', '19:00', '22:00', 3.0,
  55, 'Espacio Márquez, San Isidro', 18.00, 0,
  897500.00, 45000.00, '2026-10-20 09:15:00', '2026-10-21 16:00:00', 'admin'
);

-- Reserva 4: Evento Concurrente B en la misma fecha (Sábado, 60 invitados <= 60)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  monto_total, monto_seguro, fecha_creacion, fecha_actualizacion, actualizado_por
) VALUES (
  4, 4, '2026-11-21', '20:30', '23:30', 3.0,
  60, 'Salón Belgrano R, Sucre 2800, CABA', 7.50, 0,
  981000.00, 45000.00, '2026-10-22 17:45:00', '2026-10-23 10:00:00', 'admin'
);

-- Reserva 5: Evento Cancelado por el cliente
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  monto_total, monto_seguro, fecha_creacion, fecha_actualizacion, actualizado_por
) VALUES (
  5, 1, '2026-11-28', '20:00', '23:00', 3.0,
  70, 'Av. Corrientes 1200, CABA', 4.00, 1,
  1055000.00, 45000.00, '2026-10-18 12:00:00', '2026-10-24 09:00:00', 'admin'
);

-- 6. DETALLE DE ESTACIONES CONTRATADAS POR RESERVA
-- Reserva 1 (Tech Solutions): Entradas (1), Parrilla (3), Dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1, 1, 224000.00),
  (1, 3, 416000.00),
  (1, 5, 176000.00);

-- Reserva 2 (Finanzas Globales): Entradas (1), Pastas (2), Asiática (4), Dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (2, 1, 280000.00),
  (2, 2, 350000.00),
  (2, 4, 460000.00),
  (2, 5, 220000.00);

-- Reserva 3 (Laboratorios Río): Entradas (1), Parrilla (3), Dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (3, 1, 154000.00),
  (3, 3, 286000.00),
  (3, 5, 121000.00);

-- Reserva 4 (Innova Studio): Entradas (1), Pastas (2), Asiática (4)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (4, 1, 168000.00),
  (4, 2, 210000.00),
  (4, 4, 276000.00);

-- 7. RESTRICCIONES ALIMENTARIAS (Normalizadas 1 a N)
INSERT OR REPLACE INTO restriccion_alimentaria (id_restriccion, id_reserva, tipo_restriccion, cantidad_personas, observaciones) VALUES
  (1, 1, 'Celiaquía', 4, 'Separación estricta de utensilios y vajilla en sector este'),
  (2, 1, 'Vegetarianos', 6, 'Menú vegetariano lacto-ovo'),
  (3, 1, 'Alergias Severas', 2, 'Alérgicos a mariscos y frutos secos (nuez/almendra)'),
  (4, 2, 'Celiaquía', 5, 'Bandejeo individual termosellado sin TACC'),
  (5, 2, 'Vegetarianos', 12, 'Incluye opciones veganas en la isla asiática'),
  (6, 2, 'Veganos', 3, 'Wok exclusivo 100% a base de plantas'),
  (7, 2, 'Otros', 2, 'Menú Kosher supervisado'),
  (8, 3, 'Celiaquía', 3, 'Panera sin TACC certificada'),
  (9, 4, 'Intolerancia a la Lactosa', 4, 'Preparaciones de pastas y salsas sin derivados lácteos');

-- 8. PAGOS Y LIQUIDACIONES
-- Reserva 1: Seña 50% + Saldo 50% abonados (Totalmente saldado)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, fecha_pago, estado) VALUES
  (1, 1, 'SEÑA', 610500.00, 1, 0, '2026-09-02 11:30:00', 'confirmado'),
  (2, 1, 'SALDO', 610500.00, 1, 1, '2026-10-02 16:45:00', 'confirmado');

-- Reserva 2: Seña 50% abonada (Saldo pendiente)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, fecha_pago, estado) VALUES
  (3, 2, 'SEÑA', 902500.00, 1, 0, '2026-10-16 10:15:00', 'confirmado');

-- Reserva 3: Seña 50% abonada (Saldo pendiente)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, fecha_pago, estado) VALUES
  (4, 3, 'SEÑA', 448750.00, 1, 0, '2026-10-21 14:00:00', 'confirmado');

-- Reserva 4: Pago total 100% adelantado
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, fecha_pago, estado) VALUES
  (5, 4, 'TOTAL', 981000.00, 1, 1, '2026-10-23 09:30:00', 'confirmado');

-- 9. COMANDAS DE PRODUCCION (Desdobladas por brigada de cocina)
-- Reserva 2 (Evento en producción): 4 brigadas notificadas
INSERT OR REPLACE INTO comanda_produccion (id_comanda, id_reserva, id_estacion, observaciones, fecha_emision, actualizado_por) VALUES
  (1, 2, 1, '{"estacion": "Entradas", "comensales": 100, "dietas": {"celiacos": 5, "vegetarianos": 12}, "prioridad": "alta"}', '2026-10-16 11:30:00', 'admin'),
  (2, 2, 2, '{"estacion": "Pastas", "comensales": 100, "dietas": {"vegetarianos": 12, "kosher": 2}, "instrucciones": "Marcha a las 20:45"}', '2026-10-16 11:30:00', 'admin'),
  (3, 2, 4, '{"estacion": "Asiatica", "comensales": 100, "dietas": {"veganos": 3, "alergias": "sin sesamo"}, "woks": 2}', '2026-10-16 11:30:00', 'admin'),
  (4, 2, 5, '{"estacion": "Dulce", "comensales": 100, "dietas": {"celiacos": 5}, "postres": "Minitortas y cascada"}', '2026-10-16 11:30:00', 'admin');
