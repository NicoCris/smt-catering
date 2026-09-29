import { PRODUCTION_WINDOW_DAYS, type StationId } from '@/lib/constants'
import type { EventRecord, Station, Tariff } from '@/types/domain'

function isoInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const mockStations: Station[] = [
  { id: 'entradas', name: 'Entradas', pricePerGuestCents: 350000, description: 'Tabla de fiambres, bruschettas y verrinas' },
  { id: 'pastas', name: 'Pastas', pricePerGuestCents: 520000, description: 'Ravioles de ricota, ñoquis de papa y salsa a elección' },
  { id: 'parrilla', name: 'Parrilla', pricePerGuestCents: 610000, description: 'Bife de chorizo, cordero y verduras asadas' },
  { id: 'asiatica', name: 'Cocina Asiática', pricePerGuestCents: 570000, description: 'Rollitos, wok de vegetales y arroz jazmín' },
  { id: 'dulce', name: 'Estación Dulce', pricePerGuestCents: 280000, description: 'Petit fours, flan y mini madalenas' },
]

export const mockTariffs: Tariff[] = [
  { id: 'base-cubierto', label: 'Cubierto base (servicio y logística)', category: 'base', pricePerGuestCents: 180000 },
  ...mockStations.map<Tariff>((s) => ({ id: s.id, label: s.name, category: 'station', pricePerGuestCents: s.pricePerGuestCents })),
  { id: 'extra-manteleria', label: 'Mantelería premium', category: 'extra', pricePerGuestCents: 90000 },
  { id: 'extra-barra', label: 'Barra de tragos', category: 'extra', pricePerGuestCents: 250000 },
]

export const mockEvents: EventRecord[] = [
  {
    id: 'EV-1041',
    clientName: 'Aluar S.A. — Comité de Directores',
    eventDate: isoInDays(12),
    guests: 90,
    stationIds: ['entradas', 'pastas', 'parrilla', 'dulce'],
    status: 'Señado / Confirmado',
    paymentStatus: 'SEÑA_ABONADA',
    totalCents: 118800000,
    depositCents: 47520000,
    dietary: { celiacos: 4, vegetarianos: 7, veganos: 2, alergias: '2 comensales alérgicos a frutos secos' },
    kitchenNotes: 'Salsa sin glutamato monosódico para la mesa 6.',
  },
  {
    id: 'EV-1042',
    clientName: 'Banco Macro — Capacitación Regional',
    eventDate: isoInDays(25),
    guests: 120,
    stationIds: ['entradas', 'pastas', 'asiatica', 'dulce'],
    status: 'En Producción',
    paymentStatus: 'SALDO_PENDIENTE',
    totalCents: 159600000,
    depositCents: 63840000,
    dietary: { celiacos: 6, vegetarianos: 12, veganos: 4, alergias: 'Mariscos en mesa 3 y 4' },
    kitchenNotes: 'Confirmar logística de carga por Parque Industrial.',
  },
  {
    id: 'EV-1043',
    clientName: 'Estudio Lagom — Lanzamiento de Producto',
    eventDate: isoInDays(5),
    guests: 60,
    stationIds: ['entradas', 'parrilla', 'dulce'],
    status: 'Señado / Confirmado',
    paymentStatus: 'SEÑA_PENDIENTE',
    totalCents: 73800000,
    depositCents: 0,
    dietary: { celiacos: 1, vegetarianos: 5, veganos: 1, alergias: '' },
    kitchenNotes: 'Evento con proyección: requiere toma de corriente cerca del buffet.',
  },
  {
    id: 'EV-1044',
    clientName: 'Farmacity — Inauguración Sucursal Caballito',
    eventDate: isoInDays(48),
    guests: 100,
    stationIds: ['entradas', 'pastas', 'parrilla', 'asiatica', 'dulce'],
    status: 'Presupuestado',
    paymentStatus: 'SEÑA_PENDIENTE',
    totalCents: 143000000,
    depositCents: 0,
    dietary: { celiacos: 3, vegetarianos: 8, veganos: 3, alergias: 'Lácteos: 1 comensal' },
    kitchenNotes: '',
  },
  {
    id: 'EV-1039',
    clientName: 'MetLife — Reunión Anual',
    eventDate: isoInDays(-10),
    guests: 80,
    stationIds: ['entradas', 'pastas', 'dulce'],
    status: 'Completado',
    paymentStatus: 'TOTALMENTE_SALDADO',
    totalCents: 102400000,
    depositCents: 40960000,
    dietary: { celiacos: 2, vegetarianos: 6, veganos: 1, alergias: '' },
    kitchenNotes: '',
  },
]

export const stationById = (id: StationId): Station => {
  const found = mockStations.find((s) => s.id === id)
  if (!found) throw new Error(`Estación desconocida: ${id}`)
  return found
}

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function isWithinProductionWindow(isoDate: string): boolean {
  const d = daysUntil(isoDate)
  return d >= 0 && d <= PRODUCTION_WINDOW_DAYS
}
