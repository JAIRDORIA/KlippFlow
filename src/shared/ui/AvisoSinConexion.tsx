import { WifiOff } from 'lucide-react'

/**
 * Aviso discreto de "Sin conexión". Solo informa: las pantallas ya muestran su
 * propio error con "Reintentar" y no se toca su lógica.
 */
export function AvisoSinConexion({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--height-nav)+env(safe-area-inset-bottom)+8px)] z-[var(--z-nav)] flex justify-center px-[var(--space-screen-x)]"
    >
      <p className="type-helper flex items-center gap-2 rounded-[var(--radius-pill)] border border-amber-30 bg-elevated px-[var(--space-gap)] py-1.5 text-amber shadow-[var(--shadow-logo)]">
        <WifiOff aria-hidden="true" size={14} strokeWidth={1.6} />
        Sin conexión
      </p>
    </div>
  )
}
