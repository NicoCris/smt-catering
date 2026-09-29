import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface DownloadButtonProps {
  /** Texto plano formateado con el consolidado técnico para cocina. */
  text: string
  /** Nombre del archivo a descargar (por defecto: 'comanda-tecnica.txt'). */
  filename?: string
}

/**
 * Botón accesible para exportar la comanda técnica consolidada a archivo de texto.
 *
 * Utilidad:
 * - Permite al equipo de cocina o planta descargar la hoja de producción sin requerir
 *   conexión ni software de oficina complejo (compatible con terminales y tablets de cocina).
 */
export function DownloadButton({ text, filename = 'comanda-tecnica.txt' }: DownloadButtonProps) {
  const download = (): void => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="secondary" onClick={download} aria-label="Exportar comanda a texto">
      <Download className="h-4 w-4" />
      Exportar
    </Button>
  )
}
