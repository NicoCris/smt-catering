# Backlog de Tareas e Issues — SMT Catering

Documento de seguimiento de tareas pendientes organizadas por vistas, módulos de sistema y requerimientos de backend/infraestructura. Cada ítem incluye casillas de verificación para control de avance.

---

## 1. Backend, Infraestructura & Seguridad

- [ ] **Base de datos (Neon / PostgreSQL)**
  - [ ] Configurar conexión con instancia serverless de Neon PostgreSQL.
  - [ ] Diseñar y ejecutar migraciones iniciales para las tablas: `users`, `roles`, `events`, `stations`, `tariffs`, `dietary_requirements`, `payments` y `audit_logs`.
- [ ] **Autenticación & Sesiones**
  - [ ] Implementar autenticación basada en JWT almacenados en Cookies HTTP-only (`SameSite=Strict`, `Secure`).
  - [ ] Implementar middleware de validación y refresco de tokens para sesiones persistentes seguras.
  - [ ] Implementar hashing seguro de contraseñas con `bcrypt` (o `argon2`).
- [ ] **Sistema de Roles y Permisos (RBAC)**
  - [ ] Definir los 4 roles del sistema: `superadmin`, `admin`, `cocina` y `cliente`.
  - [ ] Crear guards en frontend y middlewares en backend para control de acceso estricto por ruta y acción.
- [ ] **Panel de Administración para Superadmin (AdminJS)**
  - [ ] Integrar AdminJS para acceso exclusivo del rol `superadmin`.
  - [ ] Configurar recursos para alta, baja, modificación y asignación de roles de usuarios.

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
  - [ ] Agregar vista y formulario de registro de clientes (nombre, email, teléfono, contraseña).
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
  - [ ] Campo para ingresar dirección o geolocalización del evento.
  - [ ] Validación de distancia: permitir contratación únicamente si la ubicación está a $\le 20\text{ km}$ del punto base establecido.
- [ ] **Selector de Islas / Estaciones**
  - [ ] Incorporar imágenes ilustrativas de alta calidad para cada una de las estaciones gastronómicas.
- [ ] **Adicionales**
  - [ ] Eliminar la opción "Mantelería" de los ítems adicionales disponibles.
- [ ] **Restricciones Alimentarias**
  - [ ] Revisar y agregar restricciones faltantes en la matriz.
  - [ ] Permitir agregar restricciones personalizadas ("Otros") indicando descripción y cantidad exacta de comensales.
- [ ] **Fecha del Evento, Horarios & Disponibilidad**
  - [ ] Reducir la antelación mínima de reserva a **15 días** (actualmente 30 días).
  - [ ] Restringir la selección de fechas exclusivamente a días **viernes, sábados y domingos**.
  - [ ] Franja horaria y duración del servicio:
    - [ ] Duración máxima del evento: **hasta 3 horas**.
    - [ ] El cliente debe seleccionar su horario dentro de la ventana operativa de **19:00 a 00:00 hs** (horario límite de finalización: 00:00 hs).
  - [ ] Regla de eventos concurrentes en una misma fecha:
    - [ ] Si una fecha posee una reserva confirmada con **$\le 60$ comensales**, la fecha permanece disponible para un segundo evento.
    - [ ] El segundo evento agendado para esa misma fecha tiene un tope estricto de **máximo 60 comensales** (rango permitido: 50 a 60 comensales).
- [ ] **Resumen Financiero & Checkout**
  - [ ] Incorporar el concepto y monto de **Seguro** en el cálculo y desglose.
  - [ ] Actualizar el porcentaje de seña al **50%** (antes 40%).
  - [ ] Permitir al cliente elegir el monto inicial a abonar: desde el mínimo de la seña (50%) hasta el 100% del total.
  - [ ] Renombrar el botón "Confirmar evento" por **"Pagar"**.
  - [ ] Quitar el botón "Compartir resumen".
  - [ ] Implementar modal informativo previo a la redirección a la pasarela de pagos.

---

## 6. Mis Eventos [Cliente]

- [ ] **Listado de Eventos Propios**
  - [ ] Crear la vista `Mis Eventos` exclusiva para clientes.
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
  - [ ] Ocultar completamente columnas e importes monetarios (totales y saldos pendientes).
  - [ ] Ocultar estados de pago y botones de edición de eventos o cobros.
  - [ ] Permitir únicamente visualizar el calendario y buscador; al hacer clic en un evento, navegar directamente al detalle de su comanda.

---

## 8. Gestión de Tarifas [Admin]

- [ ] **Ajuste de Catálogo de Tarifas**
  - [ ] Eliminar de la lista de tarifas los ítems: "Cubiertos" y "Mantelería".
  - [ ] Dar de alta la tarifa correspondiente a "Seguro".
  - [ ] Evaluar y remover la columna "Tipo" si no se utiliza operativamente.
- [ ] **Simplificación de UI**
  - [ ] Eliminar el panel o sección de historial de cambios de tarifas.

---

## 9. Métricas & Reportes [Admin]

- [ ] **Nueva Vista Independiente de Métricas**
  - [ ] Crear la ruta `/metricas` accesible únicamente para el rol `admin`.
  - [ ] Reubicar aquí los gráficos de facturación, conversión y volumen de comensales.
  - [ ] Incorporar nuevos KPIs y reportes una vez recibidas las especificaciones detalladas.

---

## 10. Comandas de Producción [Cocina]

*(Alinear con el modelo de referencia en Google Drive)*

- [ ] **Estructura del Ticket / Ficha de Producción**
  - [ ] Número identificador correlativo de comanda.
  - [ ] Fecha y hora del servicio.
  - [ ] Nombre del cliente / empresa.
  - [ ] Cantidad total de comensales, aclarando explícitamente si se trata de un **"Evento único"** o **"Evento concurrente"** en la jornada.
  - [ ] Listado de islas/estaciones contratadas (sin información de PAX ni valores monetarios).
  - [ ] Matriz de restricciones alimentarias: detalle minucioso de cada tipo de menú especial (celíacos, vegetarianos, veganos, alergias y otros) con sus respectivas cantidades.
- [ ] **Navegación Operativa**
  - [ ] Acceso directo a la comanda mediante enlace o clic en el evento desde el calendario de cocina.

