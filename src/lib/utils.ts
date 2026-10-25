import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PRODUCTION_WINDOW_DAYS } from '@/lib/constants'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Montos SIEMPRE en centavos (enteros). Ver AGENTS.md: prohibido flotante crudo. */
export function formatCurrency(cents: number, locale = 'es-AR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

/** Porcentaje entero (ej. 15) sobre montos en centavos, redondeando al centavo más cercano. */
export function applyPercent(cents: number, percent: number): number {
  return Math.round((cents * (100 + percent)) / 100)
}

/** Calcula la diferencia de días calendario entre una fecha ISO (YYYY-MM-DD) y hoy. */
export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Determina si un evento entra dentro de la ventana de producción (0 a 30 días). */
export function isWithinProductionWindow(isoDate: string): boolean {
  const d = daysUntil(isoDate)
  return d >= 0 && d <= PRODUCTION_WINDOW_DAYS
}

