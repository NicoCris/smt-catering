# SMT Catering — Plataforma B2B

Cotizador en tiempo real, dashboard de eventos y producción, y módulo de tarifas para eventos corporativos de 50 a 120 comensales.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar instalación |
|---|---|---|
| **Node.js** | ≥ 18.x (recomendado 24.x) | `node -v` |
| **npm** | ≥ 9.x (recomendado 11.x) | `npm -v` |
| **Git** | ≥ 2.x | `git --version` |

> [!NOTE]
> Si no tenés Node.js instalado, descargalo desde [nodejs.org](https://nodejs.org/) (versión LTS recomendada).

---

## Instalación desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/NicoCris/smt-catering.git
cd smt-catering
```

### 2. Instalar dependencias

```bash
npm install
```

Este comando instala todas las dependencias de producción y desarrollo definidas en `package.json`:

**Producción:**
- `react` / `react-dom` (v19) — Librería de UI
- `react-router-dom` (v7) — Enrutamiento SPA
- `zustand` (v5) — Gestión de estado global
- `@tanstack/react-query` (v5) — Cache y sincronización de datos
- `react-hook-form` + `@hookform/resolvers` + `zod` (v4) — Formularios con validación
- `@radix-ui/*` — Componentes accesibles (Dialog, Slider, Select, Checkbox, Label, Tabs, Dropdown)
- `recharts` (v3) — Gráficos del dashboard
- `date-fns` (v4) — Manipulación de fechas (calendario de disponibilidad)
- `lucide-react` — Íconos SVG
- `tailwind-merge` + `clsx` + `class-variance-authority` — Utilidades CSS

**Desarrollo:**
- `vite` (v8) — Bundler y servidor de desarrollo
- `typescript` (v6) — Tipado estricto (modo strict, sin `any`)
- `tailwindcss` (v4) + `@tailwindcss/vite` — CSS utility-first (configuración CSS-first con `@theme`)
- `@vitejs/plugin-react` — Plugin React para Vite
- `oxlint` — Linter ultrarrápido (reemplaza ESLint)

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación se abre en **http://localhost:5173**

### 4. Iniciar sesión

Al abrir la aplicación se presenta la pantalla de login.

| Campo | Valor por defecto |
|---|---|
| **Usuario** | `admin` |
| **Contraseña** | `admin` |

---

## Comandos disponibles

```bash
npm run dev        # Servidor de desarrollo (http://localhost:5173)
npm run build      # Compilación TypeScript + build de producción (dist/)
npm run preview    # Previsualizar build de producción (http://localhost:4173)
npm run lint       # Linter con oxlint
npm run typecheck  # Verificación de tipos (tsc -b --noEmit)
npm run smoke      # Smoke test SSR de las 6 vistas (scripts/smoke.mjs)
```

### Verificación completa

Ejecutar en orden antes de hacer push:

```bash
npm run lint && npm run typecheck && npm run build && npm run smoke
```

---

## Estructura del proyecto

```
smt-catering/
├── public/                  # Archivos estáticos (favicon)
├── scripts/
│   └── smoke.mjs            # Smoke test — renderiza las 6 páginas con SSR
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell (sidebar + bottom nav), GradientMesh, navegación
│   │   └── ui/              # Componentes base: Button, Input, Label, Card
│   ├── features/
│   │   ├── login/           # Pantalla de inicio de sesión
│   │   ├── quotation/       # Cotizador en tiempo real (estaciones, calendario, resumen)
│   │   ├── dashboard/       # Dashboard administrativo (KPIs, tabla de eventos)
│   │   ├── production/      # Comandas de cocina (tickets, exportación)
│   │   └── pricing/         # Gestión de tarifas (edición individual y masiva)
│   ├── stores/              # Zustand stores (auth, quotation, tariff, event)
│   ├── lib/                 # Utilidades (cn, formatCurrency), constantes, datos mock
│   └── types/               # Entidades de dominio (TypeScript interfaces)
├── index.html               # Punto de entrada HTML
├── vite.config.ts            # Configuración de Vite (alias @/, Tailwind plugin)
├── tsconfig.json             # Configuración base TypeScript
├── tsconfig.app.json         # Config TS para la app (strict)
├── tsconfig.node.json        # Config TS para scripts Node
├── .oxlintrc.json            # Configuración de oxlint
└── package.json              # Dependencias y scripts
```

---

## Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Bundler | Vite | 8.x |
| UI | React | 19.x |
| Lenguaje | TypeScript | 6.x (strict) |
| Estilos | Tailwind CSS | 4.x (CSS-first `@theme`) |
| Estado global | Zustand | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 4.x |
| Enrutamiento | React Router DOM | 7.x |
| Componentes UI | Radix UI | Últimas |
| Gráficos | Recharts | 3.x |
| Fechas | date-fns | 4.x |
| Íconos | lucide-react | 1.x |
| Linter | oxlint | 1.x |

---

## Diseño visual

El sistema de diseño sigue las especificaciones del archivo `DESIGN.md`:

- **Color primario:** Indigo `#533afd` — usado en CTAs y links
- **Tipografía:** Inter (peso 300) con tracking negativo — firma tipográfica editorial
- **Botones:** Pill shape (border-radius 9999px), padding 8×16px
- **Gradient Mesh:** Fondo atmosférico en el hero (cream → lavender → indigo → ruby)
- **Elevación:** Sombras sutiles Level 1/2 en cards

---

## Licencia

SMT Catering — Parabellum Devs - IFTS N° 29.
