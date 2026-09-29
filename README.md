# SMT Catering — Plataforma B2B

Cotizador en tiempo real, dashboard de eventos y producción, y módulo de tarifas para eventos corporativos de 50 a 120 comensales.

**Stack:** Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · React Hook Form + Zod · Radix UI · Recharts · date-fns · lucide-react

## Comandos

```bash
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run lint       # oxlint
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build
npm run smoke      # render SSR de las 5 vistas (scripts/smoke.mjs)
```

Verificación completa antes de cerrar una tarea: `lint` → `typecheck` → `build` → `smoke`.

## Estructura

```
src/
├── components/    # ui/ (átomos) · layout/ (AppShell, navegación)
├── features/      # quotation/ · dashboard/ · production/ · pricing/
├── stores/        # Zustand (quotationStore, tariffStore)
├── lib/           # utils (cn, formatCurrency) · constants · mock-data
└── types/         # entidades de dominio
```
