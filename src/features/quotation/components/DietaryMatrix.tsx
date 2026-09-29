import { AlertTriangle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuotationCalculator } from '@/features/quotation/hooks/useQuotationCalculator'
import { useQuotationStore } from '@/stores/quotationStore'

interface DietField {
  key: 'celiacos' | 'vegetarianos' | 'veganos'
  label: string
}

const fields: DietField[] = [
  { key: 'celiacos', label: 'Celíacos' },
  { key: 'vegetarianos', label: 'Vegetarianos' },
  { key: 'veganos', label: 'Veganos' },
]

/**
 * Matriz de restricciones alimentarias y alérgenos (Módulo 1: Cotizador).
 *
 * Reglas de Negocio (AGENTS.md):
 * - Gestiona celíacos, vegetarianos, veganos y descripción libre de alergias críticas.
 * - Invariante estricta: la suma de personas con dietas especiales nunca puede superar
 *   el número total de comensales contratados.
 * - Validación reactiva en caliente: alerta visual en rojo (`dietExceedsGuests`) si hay inconsistencia.
 */
export function DietaryMatrix() {
  const dietary = useQuotationStore((s) => s.dietary)
  const setDietary = useQuotationStore((s) => s.setDietary)
  const { dietTotal, dietExceedsGuests, hasStations } = useQuotationCalculator()
  const guests = useQuotationStore((s) => s.guests)

  return (
    <section aria-labelledby="dietary-label">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="dietary-label" className="text-heading-lg font-light text-ink">
          Restricciones alimentarias
        </h2>
        <span className="text-xs text-ink-mute tnum">
          {dietTotal} / {guests} comensales
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <Label htmlFor={`diet-${key}`} className="mb-1.5 block text-xs text-ink-mute">
              {label}
            </Label>
            <Input
              id={`diet-${key}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={guests}
              className="text-center tnum"
              value={dietary[key]}
              onChange={(e) => setDietary({ [key]: Math.max(0, Number(e.target.value)) })}
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Label htmlFor="diet-alergias" className="mb-1.5 block text-xs text-ink-mute">
          Alergias específicas
        </Label>
        <Input
          id="diet-alergias"
          placeholder="Ej. frutos secos, mariscos, lácteos…"
          value={dietary.alergias}
          onChange={(e) => setDietary({ alergias: e.target.value })}
        />
      </div>

      {dietExceedsGuests && (
        <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-state-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          La suma de dietas especiales ({dietTotal}) no puede superar los {guests} comensales.
        </p>
      )}
      {!hasStations && (
        <p role="alert" className="mt-2 text-sm text-state-warn">
          Seleccioná al menos una estación culinaria para cotizar.
        </p>
      )}
    </section>
  )
}
