import { useCallback, useEffect, useState } from 'react'

import { useTariffStore } from '@/stores/tariffStore'
import type { Tariff, TariffChange } from '@/types/domain'

export interface TariffManager {
  tariffs: Tariff[]
  history: TariffChange[]
  preview: Tariff[] | null
  percent: number
  setPercent: (p: number) => void
  buildPreview: (percent: number) => void
  confirmPreview: () => void
  cancelPreview: () => void
  updateTariff: (id: string, pricePerGuestCents: number) => void
}

/**
 * Hook orquestador del Módulo 3 (Tarifas).
 *
 * Funcionalidad:
 * - Gestiona el estado de vista previa transitoria (`preview`) separada del estado persistente en el store.
 * - Permite construir la proyección de incremento con `buildPreview(percent)`.
 * - Sincroniza el porcentaje exacto para registrarlo fidedignamente en el historial al confirmar.
 * - Expone `updateTariff` para ediciones individuales y `confirmPreview` para el lote completo.
 */
export function useTariffManager(): TariffManager {
  const tariffs = useTariffStore((s) => s.tariffs)
  const history = useTariffStore((s) => s.history)
  const isLoaded = useTariffStore((s) => s.isLoaded)
  const fetchTariffs = useTariffStore((s) => s.fetchTariffs)
  const previewIncrease = useTariffStore((s) => s.previewIncrease)
  const commitIncrease = useTariffStore((s) => s.commitIncrease)
  const updateTariff = useTariffStore((s) => s.updateTariff)

  useEffect(() => {
    if (!isLoaded) {
      fetchTariffs()
    }
  }, [isLoaded, fetchTariffs])

  const [preview, setPreview] = useState<Tariff[] | null>(null)
  const [percent, setPercent] = useState(15)

  const buildPreview = useCallback(
    (p: number) => {
      setPercent(p)
      setPreview(previewIncrease(p))
    },
    [previewIncrease],
  )
  const confirmPreview = useCallback(() => {
    if (preview) commitIncrease(percent, preview)
    setPreview(null)
  }, [commitIncrease, percent, preview])
  const cancelPreview = useCallback(() => setPreview(null), [])

  return {
    tariffs,
    history,
    preview,
    percent,
    setPercent,
    buildPreview,
    confirmPreview,
    cancelPreview,
    updateTariff,
  }
}
