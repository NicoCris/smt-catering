import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { daysUntil } from '@/lib/mock-data'
import { KpiGrid } from '@/features/dashboard/components/KpiGrid'
import { EventCards, EventTable } from '@/features/dashboard/components/EventTable'
import {
  summarizeEvents,
  useEvents,
} from '@/features/dashboard/hooks/useEventsSummary'
import type { EventRecord } from '@/types/domain'

type QuickFilter = 'semana' | '30d' | 'por-cobrar' | 'riesgo'

const filters: { id: QuickFilter; label: string }[] = [
  { id: 'semana', label: 'Semana actual' },
  { id: '30d', label: 'Próximos 30 días' },
  { id: 'por-cobrar', label: 'Por cobrar' },
  { id: 'riesgo', label: 'En riesgo logístico' },
]

/**
 * Aplica los filtros rápidos de supervisión operativa:
 * - 'semana': Eventos a ejecutarse dentro de los próximos 7 días corridos.
 * - '30d': Ventana de producción activa (próximos 30 días).
 * - 'por-cobrar': Eventos con saldo o seña pendiente (no saldados al 100%).
 * - 'riesgo': Eventos en los próximos 14 días que todavía tienen SEÑA_PENDIENTE (riesgo operativo).
 */
function applyFilter(events: EventRecord[], filter: QuickFilter): EventRecord[] {
  const pending = (e: EventRecord): boolean => e.paymentStatus !== 'TOTALMENTE_SALDADO'
  switch (filter) {
    case 'semana':
      return events.filter((e) => {
        const d = daysUntil(e.eventDate)
        return d >= 0 && d <= 7
      })
    case '30d':
      return events.filter((e) => {
        const d = daysUntil(e.eventDate)
        return d >= 0 && d <= 30
      })
    case 'por-cobrar':
      return events.filter(pending)
    case 'riesgo':
      return events.filter(
        (e) =>
          e.paymentStatus === 'SEÑA_PENDIENTE' && daysUntil(e.eventDate) >= 0 && daysUntil(e.eventDate) <= 14,
      )
  }
}

/**
 * Módulo 2 — Dashboard Centralizado de Eventos y Costos (Admin / Socias).
 *
 * Responsabilidades:
 * - Visión financiera consolidada (KPIs de facturación, señas cobradas y saldos por cobrar).
 * - Segmentación rápida para control operativo y riesgo de acreditación de seña.
 * - Vista híbrida responsiva: tabla para tablet/desktop y tarjetas compactas para móvil.
 */
export function DashboardPage() {
  const { data: events = [], isLoading } = useEvents()
  const [active, setActive] = useState<QuickFilter | null>(null)

  const visible = useMemo(
    () => (active ? applyFilter(events, active) : events),
    [events, active],
  )
  const summary = useMemo(() => summarizeEvents(events), [events])

  return (
    <>
      <PageHeader
        title="Eventos y costos"
        description="Supervisión financiera, calendario y estado de cobro en un solo lugar."
      />

      <KpiGrid summary={summary} />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            onClick={() => setActive((cur) => (cur === id ? null : id))}
            className={cn(
              'rounded-pill border px-4 py-2 text-sm transition-colors',
              active === id
                ? 'border-primary bg-primary text-white'
                : 'border-hairline bg-canvas text-ink-secondary hover:bg-canvas-soft',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-mute" role="status">
          Cargando eventos…
        </p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-mute">
          No hay eventos para este filtro.
        </p>
      ) : (
        <>
          <EventTable events={visible} />
          <EventCards events={visible} />
        </>
      )}
    </>
  )
}
