-- =====================================================================
-- SMT Catering — Datos Iniciales y Smoke Test Data (seed.sql)
-- Totalmente alineado con los datos y pantallas del Frontend
-- =====================================================================

-- 1. USUARIOS STAFF (Password: 'admin123')
INSERT OR REPLACE INTO usuario_staff (id_usuario, nombre_completo, email, password_hash, rol, activo) VALUES
  (1, 'Super Administrador', 'superadmin@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'superadmin', 1),
  (2, 'Coordinador Comercial', 'admin@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'admin', 1),
  (3, 'Chef Ejecutivo de Cocina', 'cocina@smtcatering.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi', 'cocina', 1);

-- 2. CLIENTES CORPORATIVOS (Empresas B2B del Mock Data)
INSERT OR REPLACE INTO cliente (id_cliente, razon_social, cuit, nombre_completo, cargo_responsable, email, telefono, direccion_legal, fecha_aniversario, password_hash) VALUES
  (1, 'Aluar S.A. — Comité de Directores', '30-50001234-9', 'Martín Aluar', 'Director de RRII', 'eventos@aluar.com.ar', '+54 11 4310-0000', 'Pasteur 4600, CABA', '1970-06-10', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (2, 'Banco Macro — Capacitación Regional', '30-50000734-5', 'Valeria Macro', 'Gerente de Capacitación', 'capacitacion@macro.com.ar', '+54 11 5222-8000', 'Av. Eduardo Madero 1180, CABA', '1988-08-22', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (3, 'Estudio Lagom — Lanzamiento de Producto', '30-71556677-4', 'Santiago Lagom', 'Socio Fundador', 'eventos@lagom.com', '+54 11 4777-1122', 'Humboldt 1550, CABA', '2018-09-15', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (4, 'Farmacity — Inauguración Sucursal Caballito', '30-69213874-3', 'Carolina Ramos', 'Jefa de Marketing', 'eventos@farmacity.com.ar', '+54 11 4814-7700', 'Santa Fe 2830, CABA', '1997-04-12', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (5, 'MetLife — Reunión Anual', '30-61112233-1', 'Federico Peña', 'Comité de Eventos', 'eventos@metlife.com.ar', '+54 11 5000-4000', 'Av. Leandro N. Alem 855, CABA', '1994-11-01', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi'),
  (6, 'Innova Digital Studio', '30-76543210-2', 'Lucía Rossi', 'Chief People Officer', 'lucia@innovastudio.com', '+54 11 4999-5566', 'Bonpland 1800, CABA', '2020-03-01', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ecgy5pLJQlnNRUxoi');

-- 3. ESTACIONES GASTRONOMICAS
INSERT OR REPLACE INTO estacion (id_estacion, codigo, nombre, tipo_comida, descripcion, precio_por_persona) VALUES
  (1, 'entradas', 'Entradas', 'salado', 'Tabla de fiambres, bruschettas y verrinas', 3500.00),
  (2, 'pastas', 'Pastas', 'salado', 'Ravioles de ricota, ñoquis de papa y salsa a elección', 5200.00),
  (3, 'parrilla', 'Parrilla', 'salado', 'Bife de chorizo, cordero y verduras asadas', 6100.00),
  (4, 'asiatica', 'Cocina Asiática', 'salado', 'Rollitos, wok de vegetales y arroz jazmín', 5700.00),
  (5, 'dulce', 'Estación Dulce', 'dulce', 'Petit fours, flan y mini madalenas', 2800.00);

-- 4. TARIFAS BASE, ESTACIONES Y SEGURO (En centavos para el cotizador)
INSERT OR REPLACE INTO tarifas (id, label, category, price_per_guest_cents, fixed_cents, is_active) VALUES
  ('base-cubierto', 'Cubierto base (servicio y logística)', 'base', 180000, 0, 1),
  ('entradas', 'Entradas', 'station', 350000, 0, 1),
  ('pastas', 'Pastas', 'station', 520000, 0, 1),
  ('parrilla', 'Parrilla', 'station', 610000, 0, 1),
  ('asiatica', 'Cocina Asiática', 'station', 570000, 0, 1),
  ('dulce', 'Estación Dulce', 'station', 280000, 0, 1),
  ('extra-manteleria', 'Mantelería premium', 'extra', 90000, 0, 1),
  ('extra-barra', 'Barra de tragos', 'extra', 250000, 0, 1),
  ('tar-seguro', 'Seguro de Evento y Responsabilidad Civil', 'insurance', 0, 4500000, 1);

-- 5. RESERVAS CON FECHAS DINÁMICAS (Usa date('now', '±X days') para estar siempre en la ventana correcta)

-- EV-1041: Aluar S.A. (+12 días) -> Dentro de ventana de producción (<= 30 días)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1041, 1, date('now', '+12 days'), '19:30', '22:30', 3.0,
  90, 'Pasteur 4600, CABA', 8.50, 0,
  'Señado / Confirmado', 'SEÑA_ABONADA', 'Salsa sin glutamato monosódico para la mesa 6.',
  1188000.00, 45000.00, datetime('now', '-30 days'), 'admin'
);

-- EV-1042: Banco Macro (+25 días) -> En Producción / Saldo pendiente (<= 30 días)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1042, 2, date('now', '+25 days'), '20:00', '23:00', 3.0,
  120, 'Av. Eduardo Madero 1180, CABA', 11.20, 0,
  'En Producción', 'SALDO_PENDIENTE', 'Confirmar logística de carga por Parque Industrial.',
  1596000.00, 45000.00, datetime('now', '-20 days'), 'admin'
);

-- EV-1043: Estudio Lagom (+5 días) -> Seña pendiente / Urgente (<= 14 días)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1043, 3, date('now', '+5 days'), '19:00', '22:00', 3.0,
  60, 'Humboldt 1550, CABA', 5.00, 0,
  'Señado / Confirmado', 'SEÑA_PENDIENTE', 'Evento con proyección: requiere toma de corriente cerca del buffet.',
  738000.00, 45000.00, datetime('now', '-15 days'), 'admin'
);

-- EV-1044: Farmacity (+48 días) -> Presupuestado / Fuera de ventana de producción (> 30 días)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1044, 4, date('now', '+48 days'), '20:00', '23:00', 3.0,
  100, 'Santa Fe 2830, CABA', 7.50, 0,
  'Presupuestado', 'SEÑA_PENDIENTE', '',
  1430000.00, 45000.00, datetime('now', '-2 days'), 'admin'
);

-- EV-1039: MetLife (-10 días) -> Histórico / Pasado / Completado
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1039, 5, date('now', '-10 days'), '19:30', '22:30', 3.0,
  80, 'Av. Leandro N. Alem 855, CABA', 9.00, 0,
  'Completado', 'TOTALMENTE_SALDADO', '',
  1024000.00, 45000.00, datetime('now', '-45 days'), 'admin'
);

-- EV-1045: Innova Digital Studio (+5 días) -> Concurrente en misma fecha con Estudio Lagom (60 y 55 pax <= 60)
INSERT OR REPLACE INTO reserva (
  id_reserva, id_cliente, fecha_evento, hora_inicio, hora_fin, duracion_horas,
  cantidad_invitados, direccion_evento, distancia_km, evento_cancelado,
  estado_evento, estado_pago, notas_cocina,
  monto_total, monto_seguro, fecha_creacion, actualizado_por
) VALUES (
  1045, 6, date('now', '+5 days'), '20:30', '23:30', 3.0,
  55, 'Bonpland 1800, CABA', 6.00, 0,
  'Señado / Confirmado', 'SEÑA_ABONADA', 'Evento concurrente con EV-1043.',
  687500.00, 45000.00, datetime('now', '-10 days'), 'admin'
);

-- 6. ESTACIONES CONTRATADAS POR RESERVA
-- EV-1041: entradas (1), pastas (2), parrilla (3), dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1041, 1, 315000.00),
  (1041, 2, 468000.00),
  (1041, 3, 549000.00),
  (1041, 5, 252000.00);

-- EV-1042: entradas (1), pastas (2), asiatica (4), dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1042, 1, 420000.00),
  (1042, 2, 624000.00),
  (1042, 4, 684000.00),
  (1042, 5, 336000.00);

-- EV-1043: entradas (1), parrilla (3), dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1043, 1, 210000.00),
  (1043, 3, 366000.00),
  (1043, 5, 168000.00);

-- EV-1044: entradas (1), pastas (2), parrilla (3), asiatica (4), dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1044, 1, 350000.00),
  (1044, 2, 520000.00),
  (1044, 3, 610000.00),
  (1044, 4, 570000.00),
  (1044, 5, 280000.00);

-- EV-1039: entradas (1), pastas (2), dulce (5)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1039, 1, 280000.00),
  (1039, 2, 416000.00),
  (1039, 5, 224000.00);

-- EV-1045: entradas (1), pastas (2), asiatica (4)
INSERT OR REPLACE INTO detalle_reserva_estacion (id_reserva, id_estacion, subtotal_calculado) VALUES
  (1045, 1, 192500.00),
  (1045, 2, 286000.00),
  (1045, 4, 313500.00);

-- 7. RESTRICCIONES ALIMENTARIAS (Normalizadas)
INSERT OR REPLACE INTO restriccion_alimentaria (id_restriccion, id_reserva, tipo_restriccion, cantidad_personas, observaciones) VALUES
  (1, 1041, 'Celiaquía', 4, 'Separación estricta de utensilios'),
  (2, 1041, 'Vegetarianos', 7, 'Opción lacto-ovo'),
  (3, 1041, 'Veganos', 2, 'Sin productos de origen animal'),
  (4, 1041, 'Alergias', 2, 'Alérgicos a frutos secos'),
  (5, 1042, 'Celiaquía', 6, 'Menú individual termosellado'),
  (6, 1042, 'Vegetarianos', 12, 'Pastas y ensaladas sin carne'),
  (7, 1042, 'Veganos', 4, 'Wok exclusivo en la isla asiática'),
  (8, 1042, 'Alergias', 2, 'Alérgicos a mariscos en mesa 3 y 4'),
  (9, 1043, 'Celiaquía', 1, 'Plato sin TACC'),
  (10, 1043, 'Vegetarianos', 5, 'Menú vegetariano'),
  (11, 1043, 'Veganos', 1, 'Menú vegano'),
  (12, 1044, 'Celiaquía', 3, 'Menú celíaco'),
  (13, 1044, 'Vegetarianos', 8, 'Menú vegetariano'),
  (14, 1044, 'Veganos', 3, 'Menú vegano'),
  (15, 1044, 'Alergias', 1, 'Intolerante a los lácteos'),
  (16, 1039, 'Celiaquía', 2, 'Menú celíaco'),
  (17, 1039, 'Vegetarianos', 6, 'Menú vegetariano'),
  (18, 1039, 'Veganos', 1, 'Menú vegano');

-- 8. PAGOS
-- EV-1041: Seña abonada (40% de 1188000 = 475200)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, estado) VALUES
  (1, 1041, 'SEÑA', 475200.00, 1, 0, 'confirmado');

-- EV-1042: Seña abonada (40% de 1596000 = 638400, saldo pendiente)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, estado) VALUES
  (2, 1042, 'SEÑA', 638400.00, 1, 0, 'confirmado');

-- EV-1039: Totalmente saldado (Seña + Saldo)
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, estado) VALUES
  (3, 1039, 'SEÑA', 409600.00, 1, 0, 'confirmado'),
  (4, 1039, 'SALDO', 614400.00, 1, 1, 'confirmado');

-- EV-1045: Seña abonada del 50%
INSERT OR REPLACE INTO pago (id_pago, id_reserva, tipo_pago, monto, pago_online, pago_completo, estado) VALUES
  (5, 1045, 'SEÑA', 343750.00, 1, 0, 'confirmado');

-- 9. COMANDAS DE PRODUCCION
INSERT OR REPLACE INTO comanda_produccion (id_comanda, id_reserva, id_estacion, observaciones, fecha_emision, actualizado_por) VALUES
  (1, 1041, 1, '{"estacion": "Entradas", "comensales": 90, "notas": "Salsa sin glutamato para mesa 6"}', datetime('now', '-5 days'), 'admin'),
  (2, 1041, 2, '{"estacion": "Pastas", "comensales": 90, "dietas": {"celiacos": 4, "vegetarianos": 7}}', datetime('now', '-5 days'), 'admin'),
  (3, 1041, 3, '{"estacion": "Parrilla", "comensales": 90, "dietas": {"vegetarianos": 7}}', datetime('now', '-5 days'), 'admin'),
  (4, 1041, 5, '{"estacion": "Dulce", "comensales": 90, "postres": "Minitortas"}', datetime('now', '-5 days'), 'admin'),
  (5, 1042, 1, '{"estacion": "Entradas", "comensales": 120, "notas": "Confirmar logistica por Parque Industrial"}', datetime('now', '-2 days'), 'admin'),
  (6, 1042, 2, '{"estacion": "Pastas", "comensales": 120, "dietas": {"celiacos": 6}}', datetime('now', '-2 days'), 'admin');
