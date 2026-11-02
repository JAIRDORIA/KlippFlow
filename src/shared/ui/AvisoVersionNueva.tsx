import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

export interface AvisoVersionNuevaProps {
  visible: boolean
  onActualizar: () => void
  onDescartar: () => void
}

/**
 * Banda discreta de "Hay una versión nueva".
 *
 * No recarga nada por su cuenta: solo ofrece "Actualizar" (activa el service
 * worker nuevo y recarga) y "Ahora no" (sigue con la versión actual). Sin
 * animaciones para respetar `prefers-reduced-motion`.
 */
export function AvisoVersionNueva({
  visible,
  onActualizar,
  onDescartar,
}: AvisoVersionNuevaProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[var(--z-toast)] flex justify-center px-[var(--space-screen-x)]"
    >
      <div className="flex w-full max-w-[520px] items-center gap-3 rounded-[var(--radius-card)] border border-line bg-elevated px-[var(--space-gap)] py-2 shadow-[var(--shadow-logo)]">
        <RefreshCw
          aria-hidden="true"
          size={16}
          strokeWidth={1.6}
          className="shrink-0 text-accent"
        />
        <p className="type-small min-w-0 flex-1 text-text">Hay una versión nueva</p>
        <Button tamano="compacto" onClick={onActualizar} className="shrink-0">
          Actualizar
        </Button>
        <Button
          variante="ghost"
          tamano="compacto"
          onClick={onDescartar}
          className="shrink-0"
        >
          Ahora no
        </Button>
      </div>
    </div>
  )
}
