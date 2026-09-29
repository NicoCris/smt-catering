import { create } from 'zustand'

import { mockTariffs } from '@/lib/mock-data'
import { applyPercent } from '@/lib/utils'
import type { Tariff, TariffChange } from '@/types/domain'

interface TariffManagerState {
  tariffs: Tariff[]
  history: TariffChange[]
  /** Aplica el incremento porcentual en memoria (para vista previa, sin confirmar). */
  previewIncrease: (percent: number) => Tariff[]
  /** Confirma la vista previa: persiste tarifas + registra en historial. */
  commitIncrease: (percent: number, preview: Tariff[]) => void
  /** Edición manual de una tarifa puntual. */
  updateTariff: (id: string, pricePerGuestCents: number) => void
}

export const useTariffStore = create<TariffManagerState>()((set, get) => ({
  tariffs: mockTariffs,
  history: [],
  previewIncrease: (percent) =>
    get().tariffs.map((t) => ({
      ...t,
      pricePerGuestCents: applyPercent(t.pricePerGuestCents, percent),
    })),
  commitIncrease: (percent, preview) =>
    set((s) => ({
      tariffs: preview,
      history: [
        {
          id: crypto.randomUUID(),
          appliedAt: new Date().toISOString(),
          percent,
          tariffCount: preview.length,
          type: 'bulk',
        },
        ...s.history,
      ],
    })),
  updateTariff: (id, pricePerGuestCents) =>
    set((s) => {
      const current = s.tariffs.find((t) => t.id === id)
      if (!current || current.pricePerGuestCents === pricePerGuestCents) {
        return s
      }
      const diffPercent =
        current.pricePerGuestCents > 0
          ? Math.round(
              ((pricePerGuestCents - current.pricePerGuestCents) /
                current.pricePerGuestCents) *
                100,
            )
          : 0

      const newChange: TariffChange = {
        id: crypto.randomUUID(),
        appliedAt: new Date().toISOString(),
        percent: diffPercent,
        tariffCount: 1,
        type: 'individual',
        tariffLabel: current.label,
        previousPriceCents: current.pricePerGuestCents,
        newPriceCents: pricePerGuestCents,
      }

      return {
        tariffs: s.tariffs.map((t) => (t.id === id ? { ...t, pricePerGuestCents } : t)),
        history: [newChange, ...s.history],
      }
    }),
}))

/**
 * NOTA DE NEGOCIO: los eventos existentes (seña abonada) conservan su precio congelado.
 * Las tarifas de este store solo alimentan cotizaciones NUEVAS.
 */
export const selectTariffs = (s: TariffManagerState): Tariff[] => s.tariffs
