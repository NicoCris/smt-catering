import { PageHeader } from '@/components/layout/AppShell'
import { AvailabilityCalendar } from '@/features/quotation/components/AvailabilityCalendar'
import { DietaryMatrix } from '@/features/quotation/components/DietaryMatrix'
import { GuestSlider } from '@/features/quotation/components/GuestSlider'
import {
  PriceSummaryDrawer,
  PriceSummaryPanel,
} from '@/features/quotation/components/PriceSummary'
import { StationSelector } from '@/features/quotation/components/StationSelector'

/**
 * Módulo 1 — Cotizador en Tiempo Real (B2B Client-Facing).
 *
 * Arquitectura y Flujo:
 * - Diseñado para clientes corporativos y socias de SMT Catering.
 * - Diseño responsivo mobile-first
 * - Compone los 4 sub-módulos del formulario:
 *   1. `GuestSlider`: Rango estricto de comensales [50–120].
 *   2. `StationSelector`: Estaciones culinarias gastronómicas y adicionales.
 *   3. `DietaryMatrix`: Restricciones alimentarias (celíacos, veganos, etc.) con validación viva.
 *   4. `AvailabilityCalendar`: Selección de fecha con antelación mínima de 30 días y bloqueo de fechas.
 */
export function QuotationPage() {
  return (
    <>
      <PageHeader
        title="Cotizá tu evento"
        description="Cotización transparente en tiempo real para eventos corporativos de 50 a 120 comensales."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <GuestSlider />
          <StationSelector />
          <DietaryMatrix />
          <AvailabilityCalendar />
        </div>
        <PriceSummaryPanel />
      </div>
      <PriceSummaryDrawer />
    </>
  )
}
