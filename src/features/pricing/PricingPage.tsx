import { PageHeader } from '@/components/layout/AppShell'
import { BulkPriceAdjuster } from '@/features/pricing/components/BulkPriceAdjuster'
import { TariffTable } from '@/features/pricing/components/TariffTable'
import { useTariffManager } from '@/features/pricing/hooks/useTariffManager'

/**
 * Módulo 3 — Panel Unificado de Tarifas (Admin).
 *
 * Responsabilidades:
 * - Visualización y mantenimiento de tarifas por comensal (estaciones y adicionales)
 *   y del monto fijo del Seguro por evento.
 * - Ajuste porcentual masivo ante inflación (con vista previa y confirmación en dos pasos).
 * - Modificación granular por ítem en tiempo real.
 * - Regla contractual: los precios modificados NO alteran cotizaciones ya señadas (precios congelados).
 */
export function PricingPage() {
  const tm = useTariffManager()

  return (
    <>
      <PageHeader
        title="Tarifas"
        description="Precios por comensal y monto fijo del seguro. Los cambios aplican solo a cotizaciones nuevas."
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
          onUpdateFixed={tm.updateFixedCents}
          preview={tm.preview}
        />
      </div>
    </>
  )
}