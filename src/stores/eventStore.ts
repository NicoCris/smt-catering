import { create } from 'zustand'

import { mockEvents } from '@/lib/mock-data'
import type { EventRecord, EventStatus, PaymentStatus } from '@/types/domain'

/**
 * Mock Data Store Reactivo de Eventos (AGENTS.md §Stack y estado).
 *
 * Arquitectura:
 * - Actúa como capa de datos centralizada para simular un backend reactivo en desarrollo.
 * - Todos los módulos (`DashboardPage`, `ComandasPage`, `AvailabilityCalendar`) se suscriben a este store.
 * - Al crear un evento desde el cotizador, se agrega aquí y se propaga automáticamente a todas las vistas.
 */
interface EventStoreState {
  events: EventRecord[]
  addEvent: (eventData: Omit<EventRecord, 'id'>) => EventRecord
  updateStatus: (id: string, status: EventStatus, paymentStatus: PaymentStatus) => void
}

/** Genera un identificador correlativo con formato estándar EV-XXXX. */
function generateNextId(existingEvents: EventRecord[]): string {
  const numericIds = existingEvents
    .map((e) => Number(e.id.replace('EV-', '')))
    .filter((n) => !Number.isNaN(n))
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 1044
  return `EV-${max + 1}`
}

export const useEventStore = create<EventStoreState>()((set, get) => ({
  events: mockEvents,
  addEvent: (eventData) => {
    const nextId = generateNextId(get().events)
    const newRecord: EventRecord = {
      ...eventData,
      id: nextId,
    }
    set((s) => ({
      events: [newRecord, ...s.events],
    }))
    return newRecord
  },
  updateStatus: (id, status, paymentStatus) =>
    set((s) => ({
      events: s.events.map((e) =>
        e.id === id ? { ...e, status, paymentStatus } : e,
      ),
    })),
}))
