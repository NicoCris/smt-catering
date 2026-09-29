import { Check, Edit2, X } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TD, TR } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { Tariff } from '@/types/domain'

const categoryLabel: Record<Tariff['category'], string> = {
  base: 'Base',
  station: 'Estación',
  extra: 'Adicional',
}

interface RowItemProps {
  tariff: Tariff
  previewPrice?: number
  onUpdate: (id: string, cents: number) => void
}

/**
 * Fila individual de la tabla de tarifas (Módulo 3: Tarifas).
 *
 * Funcionalidad:
 * - Permite edición manual y granular del precio por comensal de un ítem particular.
 * - Proporciona controles accesibles (Guardar con Enter/botón, Cancelar con Escape/botón).
 * - Cuando existe una vista previa masiva activa (`previewPrice`), muestra el precio actual tachado
 *   y el nuevo precio proyectado, inhabilitando la edición individual temporalmente.
 */
export function TariffTableRow({ tariff, previewPrice, onUpdate }: RowItemProps) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState((tariff.pricePerGuestCents / 100).toFixed(0))
  const [savedBadge, setSavedBadge] = useState(false)

  const handleSave = () => {
    const parsed = Number(val)
    if (Number.isFinite(parsed) && parsed >= 0) {
      const cents = Math.round(parsed * 100)
      onUpdate(tariff.id, cents)
      setSavedBadge(true)
      setTimeout(() => setSavedBadge(false), 2500)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setVal((tariff.pricePerGuestCents / 100).toFixed(0))
    setEditing(false)
  }

  return (
    <TR key={tariff.id}>
      <TD className="font-normal text-ink">
        <div className="flex items-center gap-2">
          <span>{tariff.label}</span>
          {savedBadge && (
            <span className="text-[10px] text-state-ok font-medium animate-pulse" role="status">
              ✓ Guardado
            </span>
          )}
        </div>
      </TD>
      <TD>
        <Badge variant={tariff.category === 'base' ? 'primary' : 'neutral'}>
          {categoryLabel[tariff.category]}
        </Badge>
      </TD>
      <TD className="text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-ink-mute">$</span>
            <Input
              type="number"
              min="0"
              step="100"
              autoFocus
              className="h-8 w-28 text-right tnum"
              aria-label={`Precio por comensal de ${tariff.label}`}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white hover:bg-primary-deep"
              title="Guardar nuevo precio"
              aria-label="Confirmar nuevo precio"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-ink-mute hover:text-ink"
              title="Cancelar edición"
              aria-label="Cancelar edición"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className={`tnum ${previewPrice ? 'text-ink-mute line-through' : 'text-ink font-normal'}`}>
            {formatCurrency(tariff.pricePerGuestCents)}
          </span>
        )}
      </TD>
      {previewPrice ? (
        <TD className="text-right font-normal text-primary-deep tnum">
          {formatCurrency(previewPrice)}
        </TD>
      ) : (
        <TD className="text-right">
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVal((tariff.pricePerGuestCents / 100).toFixed(0))
                setEditing(true)
              }}
              className="h-7 px-2.5 text-xs text-primary hover:bg-primary-subdued/20"
              aria-label={`Editar tarifa de ${tariff.label}`}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}
        </TD>
      )}
    </TR>
  )
}
