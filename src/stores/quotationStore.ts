import { create } from 'zustand'

import { GUEST_MAX, GUEST_MIN, type StationId } from '@/lib/constants'
import type { DietaryRequirement } from '@/types/domain'

/**
 * Función pura que restringe el número de comensales al rango operativo estricto [50–120].
 */
const clamp = (n: number): number => Math.min(GUEST_MAX, Math.max(GUEST_MIN, n))

/**
 * Estado global del Cotizador en Tiempo Real (Módulo 1).
 *
 * Propósito:
 * - Almacena los parámetros configurados en el cotizador interactivo.
 * - `rangeWarning`: señal reactiva para advertir al usuario cuando intentó exceder los límites [50–120].
 * - `reset`: restaura el cotizador a valores predeterminados seguros tras confirmar una reserva.
 */
interface QuotationState {
  guests: number
  /** true cuando el usuario intentó salir del rango [50-120] (mostrar advertencia amigable). */
  rangeWarning: boolean
  stationIds: StationId[]
  /** Ids de ítems adicionales (tarifas category 'extra'). */
  extraIds: string[]
  dietary: DietaryRequirement
  eventDate: string | null
  setGuests: (raw: number) => void
  dismissRangeWarning: () => void
  toggleStation: (id: StationId) => void
  toggleExtra: (id: string) => void
  setDietary: (patch: Partial<DietaryRequirement>) => void
  setEventDate: (iso: string | null) => void
  reset: () => void
}

const initialState = {
  guests: 80,
  rangeWarning: false,
  stationIds: ['entradas', 'pastas'] as StationId[],
  extraIds: [] as string[],
  dietary: { celiacos: 0, vegetarianos: 0, veganos: 0, alergias: '' },
  eventDate: null as string | null,
}

export const useQuotationStore = create<QuotationState>()((set) => ({
  ...initialState,
  setGuests: (raw) =>
    set({ guests: clamp(raw), rangeWarning: raw !== clamp(raw) }),
  dismissRangeWarning: () => set({ rangeWarning: false }),
  toggleStation: (id) =>
    set((s) => ({
      stationIds: s.stationIds.includes(id)
        ? s.stationIds.filter((x) => x !== id)
        : [...s.stationIds, id],
    })),
  toggleExtra: (id) =>
    set((s) => ({
      extraIds: s.extraIds.includes(id)
        ? s.extraIds.filter((x) => x !== id)
        : [...s.extraIds, id],
    })),
  setDietary: (patch) => set((s) => ({ dietary: { ...s.dietary, ...patch } })),
  setEventDate: (iso) => set({ eventDate: iso }),
  reset: () => set(initialState),
}))
