import { AlertTriangle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { GUEST_MAX, GUEST_MIN } from '@/lib/constants'
import { useQuotationStore } from '@/stores/quotationStore'

/**
 * Selector interactivo de comensales (Módulo 1: Cotizador).
 *
 * Invariante de Negocio (AGENTS.md):
 * - Rango estricto de operación de SMT Catering: 50 a 120 comensales.
 * - Validación sincronizada entre slider de rango y entrada numérica.
 * - Si el usuario intenta escribir un número fuera de rango, el store aplica `clamp`
 *   y activa una advertencia amigable (`rangeWarning`), impidiendo cotizaciones fuera de escala.
 */
export function GuestSlider() {
  const guests = useQuotationStore((s) => s.guests)
  const rangeWarning = useQuotationStore((s) => s.rangeWarning)
  const setGuests = useQuotationStore((s) => s.setGuests)
  const dismiss = useQuotationStore((s) => s.dismissRangeWarning)

  return (
    <section aria-labelledby="guests-label">
      <div className="mb-3 flex items-end justify-between">
        <Label id="guests-label" className="text-sm text-ink-secondary">
          Comensales
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            className="h-11 w-24 text-right tnum"
            value={guests}
            min={GUEST_MIN}
            max={GUEST_MAX}
            aria-label="Cantidad de comensales"
            onChange={(e) => setGuests(Number(e.target.value))}
          />
          <span className="text-xs text-ink-mute tnum">
            {GUEST_MIN}–{GUEST_MAX}
          </span>
        </div>
      </div>

      <Slider
        value={[guests]}
        min={GUEST_MIN}
        max={GUEST_MAX}
        step={1}
        onValueChange={([v]) => setGuests(v ?? GUEST_MIN)}
      />

      {rangeWarning && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-md bg-state-warn-bg px-3 py-2 text-sm text-state-warn"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            SMT Catering opera eventos de {GUEST_MIN} a {GUEST_MAX} comensales. Ajustamos tu
            propuesta dentro de ese rango; si necesitás menos o más, consultanos por una propuesta
            a medida.
            <button
              type="button"
              className="ml-2 underline"
              onClick={dismiss}
              aria-label="Descartar advertencia de rango"
            >
              Entendido
            </button>
          </span>
        </p>
      )}
    </section>
  )
}
