import { Check, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { formatCurrency } from '@/lib/utils'
import { mockStations } from '@/lib/mock-data'
import { useTariffStore } from '@/stores/tariffStore'
import { useQuotationStore } from '@/stores/quotationStore'

/**
 * Selector interactivo de estaciones culinarias y adicionales (Módulo 1: Cotizador).
 *
 * Arquitectura y Sincronización:
 * - Renderiza el catálogo gastronómico de SMT (Entradas, Pastas, Parrilla, Asiática, Dulce) y extras.
 * - Los precios unitarios por comensal se consultan en tiempo real desde `tariffStore`,
 *   asegurando que cualquier cambio de tarifas del Módulo 3 impacte visualmente en el cotizador.
 * - El selector de `extras` se memoriza con `useMemo` para evitar re-renderizados infinitos con React 19.
 */
export function StationSelector() {
  const stationIds = useQuotationStore((s) => s.stationIds)
  const extraIds = useQuotationStore((s) => s.extraIds)
  const toggleStation = useQuotationStore((s) => s.toggleStation)
  const toggleExtra = useQuotationStore((s) => s.toggleExtra)
  const tariffs = useTariffStore((s) => s.tariffs)

  const extras = useMemo(
    () => tariffs.filter((t) => t.category === 'extra'),
    [tariffs],
  )

  return (
    <section aria-labelledby="stations-label">
      <h2 id="stations-label" className="mb-3 text-heading-lg font-light text-ink">
        Estaciones culinarias
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {mockStations.map((station) => {
          const selected = stationIds.includes(station.id)
          return (
            <button
              key={station.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleStation(station.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-hairline bg-canvas hover:border-hairline-input'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-normal text-ink">{station.name}</span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-pill ${
                    selected ? 'bg-primary text-white' : 'bg-canvas-soft text-ink-mute'
                  }`}
                  aria-hidden="true"
                >
                  {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-mute">{station.description}</p>
              <p className="mt-2 text-sm text-ink-secondary tnum">
                {formatCurrency(
                  tariffs.find((t) => t.id === station.id)?.pricePerGuestCents ??
                    station.pricePerGuestCents,
                )}{' '}
                / comensal
              </p>
            </button>
          )
        })}
      </div>

      <h2 className="mb-3 mt-6 text-heading-lg font-light text-ink">Adicionales</h2>
      <div className="flex flex-wrap gap-2">
        {extras.map((extra) => {
          const selected = extraIds.includes(extra.id)
          return (
            <button
              key={extra.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleExtra(extra.id)}
              className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors ${
                selected
                  ? 'border-primary bg-primary text-white'
                  : 'border-hairline bg-canvas text-ink-secondary hover:bg-canvas-soft'
              }`}
            >
              {extra.label}
              <span className="tnum opacity-80">{formatCurrency(extra.pricePerGuestCents)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
