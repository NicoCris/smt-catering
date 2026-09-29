import { Printer } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { ComandaTicket } from '@/features/production/components/ComandaTicket'
import { DownloadButton } from '@/features/production/components/DownloadButton'
import { useEvents } from '@/features/dashboard/hooks/useEventsSummary'
import {
  collectDietaryAlerts,
  consolidateByStation,
  generateKitchenExport,
} from '@/features/production/utils/generateKitchenExport'
import { daysUntil, isWithinProductionWindow } from '@/lib/mock-data'

/**
 * Módulo 2 — Comandas Técnicas de Producción para Cocina y Planta Centralizada.
 *
 * Invariantes Críticas de Negocio (AGENTS.md):
 * 1. Ventana de producción: los eventos se planifican con 30 días de anticipación (`isWithinProductionWindow`).
 * 2. Cero datos financieros: JAMÁS mostrar precios, márgenes de ganancia ni estados de cobro.
 *    La cocina solo debe visualizar volúmenes netos, raciones por estación, alérgenos y notas de salud.
 * 3. Preparado para impresión física (`@media print` con `.no-print`) para despacho en planta.
 */
export function ComandaListPage() {
  const { data: events = [] } = useEvents()
  const windowed = events.filter(
    (e) => e.status !== 'Cancelado' && isWithinProductionWindow(e.eventDate),
  )
  const byStation = consolidateByStation(events)
  const alerts = collectDietaryAlerts(events)

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Comanda técnica de producción"
          description="Eventos con 30 días de anticipación — consolidado por estación para planta centralizada."
          actions={
            <>
              <DownloadButton text={generateKitchenExport(events)} />
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </>
          }
        />
      </div>

      <section className="mb-8 rounded-lg border border-hairline bg-canvas p-6 shadow-1">
        <h2 className="mb-4 text-heading-lg font-light text-ink">Raciones por estación</h2>
        {byStation.length === 0 ? (
          <p className="text-sm text-ink-mute">No hay eventos dentro de la ventana de 30 días.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Estación</TH>
                <TH className="text-right">Raciones netas</TH>
                <TH>Eventos</TH>
              </TR>
            </THead>
            <TBody>
              {byStation.map((c) => (
                <TR key={c.stationId}>
                  <TD className="font-normal">{c.stationName}</TD>
                  <TD className="text-right tnum">{c.totalRations}</TD>
                  <TD className="text-ink-mute tnum">
                    {c.events.map((e) => `${e.id} (${daysUntil(e.eventDate)}d)`).join(', ')}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section className="mb-8 rounded-lg border border-state-danger/30 bg-state-danger-bg p-6">
        <h2 className="mb-3 text-heading-lg font-light text-state-danger">
          Alertas de alérgenos y dietas
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-ink-secondary">Sin restricciones en la ventana.</p>
        ) : (
          <ul className="space-y-2 text-sm text-ink">
            {alerts.map((a) => (
              <li key={a.eventId} className="tnum">
                <span className="font-normal">{a.eventId}</span> {a.clientName} —{' '}
                {[
                  a.celiacos > 0 ? `celíacos x${a.celiacos}` : '',
                  a.vegetarianos > 0 ? `vegetarianos x${a.vegetarianos}` : '',
                  a.veganos > 0 ? `veganos x${a.veganos}` : '',
                  a.alergias ? `alergias: ${a.alergias}` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-6">
        {windowed.map((e) => (
          <ComandaTicket key={e.id} event={e} />
        ))}
      </div>
    </>
  )
}

/**
 * Vista de Comanda Técnica Individual para un evento específico (`/comandas/:eventId`).
 * Permite imprimir la hoja de producción individual para la partida de cocina asignada.
 */
export function ComandaDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { data: events = [] } = useEvents()
  const event = events.find((e) => e.id === eventId)

  if (!event) {
    return (
      <div className="no-print">
        <PageHeader title="Comanda no encontrada" description="Volvé al listado de comandas." />
      </div>
    )
  }

  return (
    <>
      <div className="no-print mb-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>
      <ComandaTicket event={event} />
    </>
  )
}
