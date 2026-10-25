# Backlog de Tareas e Issues — SMT Catering

Documento de seguimiento de tareas pendientes organizadas por vistas, módulos de sistema y requerimientos de backend/infraestructura. Cada ítem incluye casillas de verificación para control de avance.

---

## 1. Backend, Infraestructura & Base de Datos

- [x] **Modelado de Base de Datos (según Google Drive / MER_v3)**
  - [x] Contrastar y ajustar la estructura de tablas, campos y relaciones de `server/db/schema.sql` según el modelo de datos definido en `docs/MER_v3.xml`.
  - [x] Diseñar script con set de datos de prueba / smoke data (`server/db/seed.sql`) con casos realistas: eventos pasados saldados, eventos futuros señados, eventos concurrentes de $\le 60$ comensales, eventos cancelados, variedad de restricciones alimentarias normalizadas y estados de pago.
  - [x] Configurar base de datos inicial SQLite local (`server/db/smt.sqlite`) sin dependencias externas usando `node:sqlite` nativo.
  - [x] Implementar script de reinicio instantáneo `npm run db:reset` (`server/db/reset.mjs`) para sincronizar al equipo sin conflictos de migraciones.
  - [x] Configurar exclusión en `.gitignore` para no subir archivos binarios `.sqlite` a Git.
  - [ ] Migración futura / conexión con Neon PostgreSQL en producción cuando se configure el entorno cloud.
- [ ] **Autenticación & Sesiones**
  - [x] Definir middleware de autenticación por cookies HTTP-only (`server/middleware/authGuard.ts`).
  - [ ] Implementar firma y verificación real de JWT con secret key.
  - [ ] Implementar hashing seguro de contraseñas con `bcrypt` (o `argon2`).
- [ ] **Sistema de Roles y Permisos (RBAC)**
  - [x] Definir los 4 roles del sistema en contratos compartidos (`shared/types/roles.ts`): `superadmin`, `admin`, `cocina` y `cliente`.
  - [x] Crear middleware RBAC en backend (`server/middleware/roleGuard.ts`) para control de acceso por ruta y acción.
  - [ ] Integrar guards en frontend (`src/App.tsx`) para restringir rutas según rol autenticado.
- [ ] **Panel de Administración para Superadmin (AdminJS)**
  - [x] Crear módulo base de configuración (`server/modules/adminjs/adminjs.config.ts`).
  - [ ] Instalar `@adminjs/express` y conectar recursos para alta, baja, modificación y asignación de roles de usuarios.
- [x] **Arquitectura Modular Descentralizada**
  - [x] Crear capa de contratos compartidos (`shared/`) con tipos e interfaces TypeScript.
  - [x] Crear esquemas Zod compartidos (`shared/schemas/`) para validación unificada (auth y cotizador).
  - [x] Estructurar módulos verticales independientes en backend: `auth`, `events`, `quotation`, `production`, `tariffs` y `adminjs`.

---

## 2. Global, UI & Sistema de Diseño

- [ ] **Unificación de Estilos & Librerías**
  - [ ] Evaluar la necesidad de Bootstrap frente a la arquitectura actual (Tailwind CSS 4 + Radix UI) para evitar conflictos de especificidad y peso en el bundle.
  - [ ] Garantizar consistencia visual de componentes (botones, modales, formularios, tablas) según el diseño oficial.
- [ ] **Actualización de Paleta de Colores**
  - [ ] Aplicar la nueva paleta de colores en tokens de `@theme` (Tailwind) y variables globales CSS.
- [ ] **Controles de Formulario**
  - [ ] Ocultar flechas por defecto (spinners / steppers) en todos los inputs de tipo numérico (`input[type=number]`).
- [ ] **Navegación Dinámica por Rol**
  - [ ] Configurar `AppShell` y la barra de navegación para renderizar únicamente las secciones habilitadas según el rol del usuario conectado.

---

## 3. Login & Autenticación

- [ ] **Recuperación de Contraseña**
  - [ ] Agregar enlace "¿Olvidaste tu contraseña?" en el formulario de login.
  - [ ] Desarrollar vista y endpoint para solicitud de restablecimiento y cambio de contraseña con token temporal.
- [ ] **Registro de Nuevos Usuarios (`cliente`)**
  - [x] Definir esquema de validación Zod (`shared/schemas/auth.schema.ts`) y endpoint backend inicial (`server/modules/auth/`).
  - [ ] Agregar vista y formulario de registro en frontend.
  - [ ] Asignar automáticamente el rol `cliente` a nuevos registros.
- [ ] **Redirección de Superadmin**
  - [ ] Al detectar inicio de sesión exitoso con rol `superadmin`, redirigir automáticamente al panel de AdminJS.

---

## 4. Perfil & Configuración Personal [Cliente]

- [ ] **Acceso a Configuración**
  - [ ] Incorporar ícono de engranaje (ruedita) en la barra de navegación superior para el rol `cliente`.
- [ ] **Gestión de Datos Personales**
  - [ ] Pantalla para visualización y actualización de información de contacto (nombre, email, teléfono, razón social).
- [ ] **Cambio de Contraseña**
  - [ ] Formulario de actualización de contraseña con validación de contraseña actual y nueva contraseña.

---

## 5. Cotizador [Cliente]

- [ ] **Validación de Ubicación**
  - [x] Definir regla de distancia máxima $\le 20\text{ km}$ en esquema Zod (`shared/schemas/quotation.schema.ts`).
  - [ ] Campo en frontend para ingresar dirección o geolocalización del evento.
  - [ ] Validación de distancia contra el punto base establecido.
- [ ] **Selector de Islas / Estaciones**
  - [ ] Incorporar imágenes ilustrativas de alta calidad para cada una de las estaciones gastronómicas.
- [ ] **Adicionales**
  - [ ] Eliminar la opción "Mantelería" de los ítems adicionales disponibles.
- [ ] **Restricciones Alimentarias**
  - [x] Tipado de modelo para "Otros" con detalle y cantidad (`shared/types/events.ts`).
  - [ ] Revisar y agregar restricciones faltantes en la matriz UI.
  - [ ] Permitir agregar restricciones personalizadas ("Otros") indicando descripción y cantidad exacta de comensales.
- [ ] **Fecha del Evento, Horarios & Disponibilidad**
  - [x] Definir reglas de validación en esquema Zod y backend (`server/modules/quotation/`).
  - [ ] Reducir la antelación mínima de reserva a **15 días** (en UI y calendario).
  - [ ] Restringir la selección de fechas exclusivamente a días **viernes, sábados y domingos**.
  - [ ] Franja horaria y duración del servicio:
    - [ ] Duración máxima del evento: **hasta 3 horas**.
    - [ ] El cliente debe seleccionar su horario dentro de la ventana operativa de **19:00 a 00:00 hs** (horario límite de finalización: 00:00 hs).
  - [ ] Regla de eventos concurrentes en una misma fecha:
    - [x] Lógica de disponibilidad concurrente implementada en backend (`QuotationService.checkAvailability`).
    - [ ] Reflejar en calendario UI: si una fecha posee reserva con $\le 60$ comensales, habilitar para un segundo evento de máx 60 comensales.
- [ ] **Resumen Financiero & Checkout**
  - [x] Incorporar tarifa de **Seguro** en base de datos y cálculo de backend.
  - [x] Ajustar seña al **50%** en cálculo de cotización.
  - [ ] Permitir al cliente elegir el monto inicial a abonar en frontend: desde el mínimo de seña (50%) hasta el 100% total.
  - [ ] Renombrar el botón "Confirmar evento" por **"Pagar"**.
  - [ ] Quitar el botón "Compartir resumen".
  - [ ] Implementar modal informativo previo a la redirección a la pasarela de pagos.

---

## 6. Mis Eventos [Cliente]

- [ ] **Listado de Eventos Propios**
  - [x] Crear scaffold de la vista `src/features/my-events/MyEventsPage.tsx`.
  - [x] Endpoint backend para consultar eventos propios del cliente (`GET /api/events/my-events`).
  - [ ] Mostrar tarjetas/grilla con: fecha contratada, comensales, estaciones seleccionadas y estado de cobro.
- [ ] **Acciones Disponibles por Evento**
  - [ ] **Ver Detalle:** modal o vista con el desglose completo de la cotización y servicios.
  - [ ] **Pagar Saldo Restante:** botón para abonar el saldo pendiente con redirección a pasarela de pagos.
  - [ ] **Comprobantes:** descarga o previsualización de recibos/comprobantes de pago efectuados.
  - [ ] **Reprogramación:** solicitar cambio de fecha, validando únicamente que la nueva fecha cumpla con las reglas de disponibilidad y concurrencia.
  - [ ] **Cancelación:** botón para solicitar cancelación del evento según las políticas de cancelación.

---

## 7. Eventos & Calendario [Admin & Cocina]

- [ ] **Migración a DataTable & Paginación**
  - [ ] Implementar tabla avanzada con paginación de hasta **15 registros por página**.
  - [ ] Columnas con flechas interactivas para ordenamiento ascendente y descendente (sortable).
- [ ] **Filtros & Búsqueda**
  - [ ] Filtro por rango de fechas (con soporte para consultar eventos históricos/pasados).
  - [ ] Buscador en tiempo real por nombre de cliente.
  - [ ] Filtro por estado del evento.
  - [ ] Quitar el indicador o columna de "Riesgo logístico".
- [ ] **Ajuste de Columnas (según Figma)**
  - [ ] Modificar la columna "Total": exhibir el importe total y, debajo en tipografía secundaria, el saldo pendiente (eliminar mención de seña en esa celda).
- [ ] **Acciones de Administración (`admin`)**
  - [ ] Botón para editar parámetros del evento.
  - [ ] Botón para cambio/reprogramación manual de fecha.
  - [ ] Registro de pago manual cuando el cliente abona fuera de pasarela (sin redireccionar a pasarela de pagos externa).
- [ ] **Separación de Vistas**
  - [ ] Mover las métricas y gráficos estadísticos a la vista independiente de "Métricas".
- [ ] **Restricciones de Acceso para Rol Cocina (`cocina`)**
  - [x] Sanitización implementada en backend (`EventsController.list`): oculta montos y estados de cobro al rol `cocina`.
  - [ ] Ocultar en UI frontend las columnas de importes, saldos y botones de cobro/edición para el rol cocina.
  - [ ] Al hacer clic en un evento desde la vista de cocina, navegar directamente al detalle de su comanda.

---

## 8. Gestión de Tarifas [Admin]

- [ ] **Ajuste de Catálogo de Tarifas**
  - [x] Cargar en base de datos (`server/db/seed.sql`) la tarifa de "Seguro" y excluir cubiertos y mantelería.
  - [ ] Eliminar de la UI de tarifas los ítems: "Cubiertos" y "Mantelería".
  - [ ] Visualizar la tarifa correspondiente a "Seguro".
  - [ ] Evaluar y remover la columna "Tipo" si no se utiliza operativamente.
- [ ] **Simplificación de UI**
  - [ ] Eliminar el panel o sección de historial de cambios de tarifas.

---

## 9. Métricas & Reportes [Admin]

- [ ] **Nueva Vista Independiente de Métricas**
  - [x] Crear scaffold de la vista `src/features/metrics/MetricsPage.tsx`.
  - [ ] Configurar la ruta `/metricas` accesible únicamente para el rol `admin`.
  - [ ] Reubicar aquí los gráficos de facturación, conversión y volumen de comensales.
  - [ ] Incorporar nuevos KPIs y reportes una vez recibidas las especificaciones detalladas.

---

## 10. Comandas de Producción [Cocina]

*(Alinear con el modelo de referencia en Google Drive)*

- [ ] **Estructura del Ticket / Ficha de Producción**
  - [x] Modelo de comanda de cocina estructurado en backend (`ProductionService.getComanda`) sin información de precios ni montos monetarios.
  - [x] Número identificador correlativo de comanda (`CMD-EV-XXXX`).
  - [x] Detección automática de **"Evento único"** vs **"Evento concurrente"** en la jornada.
  - [ ] Renderizado en UI del ticket con fecha, hora, cliente, pax, islas contratadas y detalle minucioso de restricciones alimentarias.
- [ ] **Navegación Operativa**
  - [ ] Acceso directo a la comanda mediante enlace o clic en el evento desde el calendario de cocina.
