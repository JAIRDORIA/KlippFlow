import { TriangleAlert } from 'lucide-react'
import { Button } from './Button'

export interface EstadoErrorProps {
  mensaje?: string
  onReintentar: () => void
  reintentando?: boolean
}

/** Error de consulta con el botón "Reintentar" que pide el diseño. */
export function EstadoError({
  mensaje = 'Algo salió mal. Inténtalo de nuevo.',
  onReintentar,
  reintentando = false,
}: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center"
    >
      <TriangleAlert aria-hidden="true" size={26} strokeWidth={1.6} className="text-amber" />
      <p className="type-small max-w-sm text-secondary">{mensaje}</p>
      <Button
        variante="ghost"
        tamano="compacto"
        onClick={onReintentar}
        cargando={reintentando}
      >
        Reintentar
      </Button>
    </div>
  )
}
