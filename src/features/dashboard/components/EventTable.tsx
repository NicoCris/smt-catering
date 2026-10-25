import { Link } from 'react-router-dom'

import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { daysUntil, formatCurrency } from '@/lib/utils'
import { EventStatusBadge, PaymentStatusBadge } from '@/features/dashboard/components/StatusBadges'
import type { EventRecord } from '@/types/domain'

const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  )

/**
 * Vista tabular de eventos para pantallas tablet y desktop (>768px).
 *
 * Funcionalidad:
 * - Ordenamiento cronológico ascendente por fecha del evento.
 * - Enlace directo al detalle de comanda técnica por evento (`/comandas/:id`).
 * - Distingue visualmente eventos dentro de la ventana de producción (en <= 30 días).
 * - Renderiza los badges de estado desacoplados: Estado del evento vs. Estado de cobro.
 */
export function EventTable({ events }: { events: EventRecord[] }) {
  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))

  return (
    <div className="hidden md:block">
      <Table>
        <THead>
          <TR>
            <TH>Fecha</TH>
            <TH>Cliente</TH>
            <TH>Comensales</TH>
            <TH>Estado</TH>
            <TH>Cobro</TH>
            <TH className="text-right">Total</TH>
          </TR>
        </THead>
        <TBody>
          {sorted.map((e) => {
            const d = daysUntil(e.eventDate)
            return (
              <TR key={e.id}>
                <TD className="whitespace-nowrap">
                  <span className="tnum">{fmtDate(e.eventDate)}</span>
                  {d >= 0 && d <= 30 && (
                    <span className="ml-2 text-[10px] uppercase text-primary">en {d} días</span>
                  )}
                </TD>
                <TD>
                  <Link to={`/comandas/${e.id}`} className="hover:text-primary hover:underline">
                    {e.clientName}
                  </Link>
                </TD>
                <TD className="tnum">{e.guests}</TD>
                <TD>
                  <EventStatusBadge status={e.status} />
                </TD>
                <TD>
                  <PaymentStatusBadge status={e.paymentStatus} />
                </TD>
                <TD className="text-right font-normal tnum">{formatCurrency(e.totalCents)}</TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
    </div>
  )
}

/** Móvil (<768px): tarjetas colapsables en lugar de tabla. */
export function EventCards({ events }: { events: EventRecord[] }) {
  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))

  return (
    <div className="space-y-3 md:hidden">
      {sorted.map((e) => (
        <Link
          key={e.id}
          to={`/comandas/${e.id}`}
          className="block rounded-lg border border-hairline bg-canvas p-4 shadow-1"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-normal text-ink">{e.clientName}</span>
            <span className="text-xs text-ink-mute tnum">{fmtDate(e.eventDate)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EventStatusBadge status={e.status} />
            <PaymentStatusBadge status={e.paymentStatus} />
          </div>
          <div className="mt-2 flex justify-between text-sm text-ink-secondary">
            <span className="tnum">{e.guests} comensales</span>
            <span className="font-normal tnum">{formatCurrency(e.totalCents)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
