import { AlertOctagon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { stationById } from '@/lib/constants'
import { daysUntil } from '@/lib/utils'
import type { EventRecord } from '@/types/domain'

const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(
    new Date(`${iso}T00:00:00`),
  )

function DietTags({ event }: { event: EventRecord }): React.ReactNode {
  const { dietary } = event
  const tags: string[] = []
  if (dietary.celiacos > 0) tags.push(`Celíacos x${dietary.celiacos}`)
  if (dietary.vegetarianos > 0) tags.push(`Vegetarianos x${dietary.vegetarianos}`)
  if (dietary.veganos > 0) tags.push(`Veganos x${dietary.veganos}`)

  if (tags.length === 0 && !dietary.alergias) {
    return <p className="text-sm text-ink-mute">Sin restricciones registradas.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <Badge key={t} variant="primary">
          {t}
        </Badge>
      ))}
      {dietary.alergias && (
        <span className="flex items-center gap-1.5 rounded-md bg-state-danger-bg px-2 py-1 text-xs text-state-danger">
          <AlertOctagon className="h-3.5 w-3.5" />
          {dietary.alergias}
        </span>
      )}
    </div>
  )
}

/**
 * Ficha de Comanda Técnica por Evento para Jefatura de Cocina (AGENTS.md).
 *
 * Contenido expuesto:
 * - Volumen neto de comensales contratados (`guests`).
 * - Desglose de estaciones culinarias y raciones a elaborar por partida.
 * - Restricciones de salud: celíacos, vegetarianos, veganos y alertas de alérgenos graves.
 * - Observaciones críticas de logística y despacho (`kitchenNotes`).
 *
 * PROHIBICIÓN ESTRICTA DE NEGOCIO:
 * - Jamás exponer precios, importes en centavos, márgenes de ganancia ni estados de cobro.
 */
export function ComandaTicket({ event }: { event: EventRecord }) {
  const d = daysUntil(event.eventDate)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{event.clientName}</CardTitle>
          <p className="mt-1 text-sm text-ink-mute tnum">
            {event.id} · {fmtDate(event.eventDate)} · {event.guests} comensales
          </p>
        </div>
        <Badge variant={d <= 30 && d >= 0 ? 'warn' : 'neutral'}>
          {d >= 0 ? `faltan ${d} días` : 'realizado'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs uppercase tracking-tight text-ink-mute">
            Estaciones / raciones
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-ink sm:grid-cols-3">
            {event.stationIds.map((id) => (
              <li key={id} className="flex justify-between gap-2 rounded-md bg-canvas-soft px-2 py-1.5">
                <span>{stationById(id).name}</span>
                <span className="tnum">{event.guests} raciones</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs uppercase tracking-tight text-ink-mute">
            Dietas y alérgenos
          </h4>
          <DietTags event={event} />
        </div>

        {event.kitchenNotes && (
          <div>
            <h4 className="mb-1 text-xs uppercase tracking-tight text-ink-mute">Observaciones</h4>
            <p className="text-sm text-ink-secondary">{event.kitchenNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
