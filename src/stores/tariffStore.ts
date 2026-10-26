import { create } from 'zustand'

import { api } from '@/lib/api'
import { applyPercent } from '@/lib/utils'
import type { Tariff, TariffChange } from '@/types/domain'

interface TariffManagerState {
  tariffs: Tariff[]
  history: TariffChange[]
  isLoading: boolean
  isLoaded: boolean
  fetchTariffs: () => Promise<void>
  /** Aplica el incremento porcentual en memoria (para vista previa, sin confirmar). */
  previewIncrease: (percent: number) => Tariff[]
  /** Confirma la vista previa: persiste tarifas + registra en historial. */
  commitIncrease: (percent: number, preview: Tariff[]) => void
  /** Edición manual de una tarifa puntual. */
  updateTariff: (id: string, pricePerGuestCents: number) => void
  /** Edición del monto fijo por evento (ej. Seguro), en centavos. */
  updateFixedCents: (id: string, fixedCents: number) => void
}

export const useTariffStore = create<TariffManagerState>()((set, get) => ({
  tariffs: [],
  history: [],
  isLoading: false,
  isLoaded: false,

  fetchTariffs: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get<{ tariffs: Tariff[] }>('/api/tariffs')
      if (res && Array.isArray(res.tariffs)) {
        set({ tariffs: res.tariffs, isLoading: false, isLoaded: true })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  previewIncrease: (percent) =>
    get().tariffs.map((t) => ({
      ...t,
      pricePerGuestCents: applyPercent(t.pricePerGuestCents, percent),
    })),

  commitIncrease: (percent, preview) => {
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
    }))

    // Persistir lote en SQLite vía API
    api.post('/api/tariffs/bulk', { tariffs: preview }).catch((err) => {
      console.warn('No se pudo persistir el lote de tarifas en la API:', err)
    })
  },

  updateTariff: (id, pricePerGuestCents) => {
    const current = get().tariffs.find((t) => t.id === id)
    if (!current || current.pricePerGuestCents === pricePerGuestCents) {
      return
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

    set((s) => ({
      tariffs: s.tariffs.map((t) => (t.id === id ? { ...t, pricePerGuestCents } : t)),
      history: [newChange, ...s.history],
    }))

    // Persistir en SQLite vía API
    api.put(`/api/tariffs/${id}`, { pricePerGuestCents }).catch((err) => {
      console.warn(`No se pudo actualizar la tarifa ${id} en la API:`, err)
    })
  },

  updateFixedCents: (id, fixedCents) => {
    const current = get().tariffs.find((t) => t.id === id)
    if (!current || (current.fixedCents ?? 0) === fixedCents) return

    set((s) => ({
      tariffs: s.tariffs.map((t) => (t.id === id ? { ...t, fixedCents } : t)),
    }))

    api
      .put(`/api/tariffs/${id}`, { pricePerGuestCents: current.pricePerGuestCents, fixedCents })
      .catch((err) => {
        console.warn(`No se pudo actualizar la tarifa ${id} en la API:`, err)
      })
  },
}))

/**
 * NOTA DE NEGOCIO: los eventos existentes (seña abonada) conservan su precio congelado.
 * Las tarifas de este store solo alimentan cotizaciones NUEVAS.
 */
export const selectTariffs = (s: TariffManagerState): Tariff[] => s.tariffs
