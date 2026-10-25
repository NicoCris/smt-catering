# SMT Catering — Plataforma B2B

Plataforma de cotización en tiempo real, gestión de eventos y comandas de cocina para eventos corporativos (50 a 120 comensales).

---

## 🚀 Inicio Rápido (Cómo levantar el proyecto)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Inicializar la Base de Datos local
Crea el archivo SQLite local (`server/db/smt.sqlite`) y carga usuarios, estaciones y eventos de prueba:
```bash
npm run db:reset
```

### 3. Levantar la aplicación
Abrir **dos terminales**:

- **Terminal 1:** Levanta el Backend (API) en el puerto `3001`
  ```bash
  npm run server
  ```

- **Terminal 2:** Levanta el Frontend (Web) en el puerto `5173`
  ```bash
  npm run dev
  ```

Abrir en el navegador: **http://localhost:5173**

---

## 👥 Usuarios de Prueba para Iniciar Sesión

| Rol | Usuario | Contraseña | ¿Qué puede ver? |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Dashboard, cotizador, edición de eventos y tarifas |
| **Cocina** | `cocina` | `admin123` | Calendario y comandas de producción (sin precios) |
| **Cliente** | `cliente` | `admin123` | Cotizador interactivo y "Mis Eventos" |
| **Superadmin** | `superadmin` | `admin123` | Panel general y gestión de usuarios |

---

## 🛠️ Comandos útiles

```bash
npm run db:reset   # Reinicia la base de datos SQLite y recarga datos de prueba (seed)
npm run server     # Inicia el servidor backend (http://localhost:3001)
npm run dev        # Inicia el frontend Vite (http://localhost:5173)
npm run lint       # Revisa el código con oxlint
npm run typecheck  # Verifica tipos con TypeScript (tsc)
npm run smoke      # Ejecuta prueba de renderizado de vistas
```

Antes de subir cambios a Git, asegurate de correr:
```bash
npm run lint && npm run typecheck
```

---

## 📁 Estructura básica del proyecto

```
smt-catering/
├── src/                # Frontend (React 19, Tailwind CSS 4, React Router)
│   ├── components/     # Componentes visuales reutilizables (Botones, Modales, Tablas)
│   ├── features/       # Pantallas agrupadas por funcionalidad (cotizador, dashboard, etc.)
│   └── stores/         # Estado global (Zustand)
├── server/             # Backend (Node.js)
│   ├── db/             # Base de datos SQLite (schema.sql, seed.sql, reset.mjs)
│   └── modules/        # Rutas y controladores (auth, events, quotation, etc.)
├── shared/             # Contratos compartidos entre front y back (tipos TS y esquemas Zod)
└── docs/               # Documentación interna (ISSUES.md y diagrama MER_v3.xml)
```
