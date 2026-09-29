import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
