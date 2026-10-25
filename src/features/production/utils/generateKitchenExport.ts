import { STATIONS, type StationId } from '@/lib/constants'
import { isWithinProductionWindow } from '@/lib/utils'
import type { EventRecord } from '@/types/domain'

export interface StationConsolidation {
  stationId: StationId
  stationName: string
  totalRations: number
  events: EventRecord[]
}

/**
 * Consolidado técnico de raciones netas agrupadas por estación culinaria (Módulo 2).
 *
 * Algoritmo y Reglas:
 * 1. Filtra únicamente eventos activos (excluye `Cancelado`) en la ventana de 30 días (`isWithinProductionWindow`).
 * 2. Suma las raciones requeridas para cada estación (`STATIONS`) según los comensales de cada evento vinculado.
 * 3. Excluye estaciones sin demanda en la ventana.
 * 4. Formato exclusivo para brigada de cocina y aprovisionamiento (sin datos financieros).
 */
export function consolidateByStation(events: EventRecord[]): StationConsolidation[] {
  const windowed = events.filter(
    (e) => e.status !== 'Cancelado' && isWithinProductionWindow(e.eventDate),
  )

  return STATIONS.map(({ id, name }) => {
    const related = windowed.filter((e) => e.stationIds.includes(id))
    return {
      stationId: id,
      stationName: name,
      totalRations: related.reduce((sum, e) => sum + e.guests, 0),
      events: related,
    }
  }).filter((c) => c.events.length > 0)
}

export interface DietaryAlert {
  eventId: string
  clientName: string
  celiacos: number
  vegetarianos: number
  veganos: number
  alergias: string
}

export function collectDietaryAlerts(events: EventRecord[]): DietaryAlert[] {
  return events
    .filter((e) => isWithinProductionWindow(e.eventDate) && e.status !== 'Cancelado')
    .filter(
      (e) =>
        e.dietary.celiacos > 0 ||
        e.dietary.vegetarianos > 0 ||
        e.dietary.veganos > 0 ||
        e.dietary.alergias.trim().length > 0,
    )
    .map((e) => ({ eventId: e.id, clientName: e.clientName, ...e.dietary }))
}

/** Export de texto plano (imprimible / copiable a planta). Prohibido: precios, márgenes, cobros. */
export function generateKitchenExport(events: EventRecord[]): string {
  const byStation = consolidateByStation(events)
  const alerts = collectDietaryAlerts(events)

  const lines: string[] = ['SMT CATERING — COMANDA TÉCNICA (ventana 30 días)', '']

  lines.push('== RACIONES POR ESTACIÓN ==')
  for (const c of byStation) {
    lines.push(`${c.stationName}: ${c.totalRations} raciones`)
    for (const e of c.events) {
      lines.push(`   - ${e.eventDate} ${e.id} ${e.clientName} (${e.guests} pax)`)
    }
  }

  lines.push('', '== DIETAS Y ALÉRGENOS ==')
  if (alerts.length === 0) lines.push('Sin restricciones registradas.')
  for (const a of alerts) {
    const parts = [
      a.celiacos > 0 ? `celíacos x${a.celiacos}` : '',
      a.vegetarianos > 0 ? `vegetarianos x${a.vegetarianos}` : '',
      a.veganos > 0 ? `veganos x${a.veganos}` : '',
      a.alergias ? `alergias: ${a.alergias}` : '',
    ].filter(Boolean)
    lines.push(`${a.eventId} ${a.clientName}: ${parts.join(' · ')}`)
  }

  return lines.join('\n')
}
