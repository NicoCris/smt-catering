import { PageHeader } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { BulkPriceAdjuster } from '@/features/pricing/components/BulkPriceAdjuster'
import { TariffTable } from '@/features/pricing/components/TariffTable'
import { useTariffManager } from '@/features/pricing/hooks/useTariffManager'
import { formatCurrency } from '@/lib/utils'

const fmtTime = (iso: string): string =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

/**
 * Módulo 3 — Panel Unificado de Tarifas (Admin).
 *
 * Responsabilidades:
 * - Visualización y mantenimiento de tarifas base por comensal (servicio base, estaciones y adicionales).
 * - Ajuste porcentual masivo ante inflación (con vista previa y confirmación en dos pasos).
 * - Modificación granular por ítem en tiempo real.
 * - Auditoría y trazabilidad mediante el Historial de Cambios cronológico.
 * - Regla contractual: los precios modificados NO alteran cotizaciones ya señadas (precios congelados).
 */
export function PricingPage() {
  const tm = useTariffManager()

  return (
    <>
      <PageHeader
        title="Tarifas"
        description="Precios base por comensal. Los cambios aplican solo a cotizaciones nuevas."
      />

      <div className="mb-6">
        <BulkPriceAdjuster
          previewActive={tm.preview !== null}
          onPreview={tm.buildPreview}
          onConfirm={tm.confirmPreview}
          onCancel={tm.cancelPreview}
        />
      </div>

      <div className="rounded-lg border border-hairline bg-canvas shadow-1">
        <TariffTable
          tariffs={tm.tariffs}
          onUpdate={tm.updateTariff}
          preview={tm.preview}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-heading-lg font-light text-ink">Historial de cambios</h2>
        {tm.history.length === 0 ? (
          <p className="text-sm text-ink-mute">Sin ajustes registrados todavía.</p>
        ) : (
          <ul className="space-y-2">
            {tm.history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-md border border-hairline bg-canvas px-4 py-2.5 text-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-ink-secondary">
                  <span className="font-medium text-ink">
                    {h.type === 'individual' && h.tariffLabel
                      ? `Tarifa: ${h.tariffLabel}`
                      : `Ajuste masivo (${h.tariffCount} ítems)`}
                  </span>
                  {h.type === 'individual' &&
                    h.previousPriceCents !== undefined &&
                    h.newPriceCents !== undefined && (
                      <span className="text-xs text-ink-mute tnum">
                        {formatCurrency(h.previousPriceCents)} →{' '}
                        {formatCurrency(h.newPriceCents)}
                      </span>
                    )}
                </div>
                <span className="flex items-center gap-3">
                  <Badge variant={h.percent >= 0 ? 'warn' : 'ok'}>
                    {h.percent >= 0 ? '+' : ''}
                    {h.percent}%
                  </Badge>
                  <span className="text-xs text-ink-mute tnum">{fmtTime(h.appliedAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs text-ink-mute">
        Ejemplo de referencia: un cubierto base hoy vale{' '}
        <span className="tnum">
          {formatCurrency(tm.tariffs.find((t) => t.category === 'base')?.pricePerGuestCents ?? 0)}
        </span>
        .
      </p>
    </>
  )
}
