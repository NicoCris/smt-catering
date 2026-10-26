import { Table, TBody, TH, THead, TR } from '@/components/ui/table'
import { TariffTableRow } from '@/features/pricing/components/TariffTableRow'
import type { Tariff } from '@/types/domain'

interface Props {
  /** Colección de tarifas vigentes en el store. */
  tariffs: Tariff[]
  /** Callback para persistir el nuevo precio por comensal de una tarifa en centavos enteros. */
  onUpdate: (id: string, pricePerGuestCents: number) => void
  /** Callback para persistir un monto fijo por evento (ej. Seguro) en centavos enteros. */
  onUpdateFixed: (id: string, fixedCents: number) => void
  /**
   * Vista previa temporal de ajuste masivo (porcentaje de inflación).
   * Si está presente, la tabla se bloquea para edición individual y muestra precios proyectados.
   */
  preview?: Tariff[] | null
}

/**
 * Tabla editable de ítems base, estaciones culinarias y adicionales (Módulo 3: Tarifas).
 *
 * Arquitectura y Reglas de Negocio:
 * - Los precios gestionados aquí son por comensal (ARS), salvo el Seguro, que es un monto fijo por evento.
 * - Admite dos flujos de actualización:
 *   1. Edición individual interactiva ítem por ítem (mediante `TariffTableRow`).
 *   2. Ajuste porcentual masivo (orquestado por `BulkPriceAdjuster` y `useTariffManager`).
 */
export function TariffTable({
  tariffs,
  onUpdate,
  onUpdateFixed,
  preview,
}: Props): React.ReactElement {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Ítem</TH>
          <TH>Tipo</TH>
          <TH className="text-right">Precio</TH>
          <TH className="text-right">{preview ? 'Nuevo precio masivo' : 'Acción'}</TH>
        </TR>
      </THead>
      <TBody>
        {tariffs.map((t) => {
          const previewItem = preview?.find((x) => x.id === t.id)
          return (
            <TariffTableRow
              key={`${t.id}-${t.pricePerGuestCents}`}
              tariff={t}
              previewPrice={previewItem?.pricePerGuestCents}
              onUpdate={onUpdate}
              onUpdateFixed={onUpdateFixed}
            />
          )
        })}
      </TBody>
    </Table>
  )
}