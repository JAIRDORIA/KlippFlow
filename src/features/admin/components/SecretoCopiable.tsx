import { Button } from '@/shared/ui/Button'
import { useCopiar } from './useCopiar'

export interface SecretoCopiableProps {
  etiqueta: string
  valor: string
}

/**
 * Dato de una sola vez (usuario, contraseña, código o link) con su "Copiar".
 * No usa `aria-live` propio: el bloque que lo contiene se anuncia al aparecer.
 */
export function SecretoCopiable({ etiqueta, valor }: SecretoCopiableProps) {
  const copiar = useCopiar()

  return (
    <div className="flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-elevated px-[var(--space-gap-lg)] py-[var(--space-gap)]">
      <div className="min-w-0">
        <p className="type-label">{etiqueta}</p>
        <p className="type-form mt-1 break-all font-mono text-text">{valor}</p>
      </div>

      <Button
        variante="ghost"
        tamano="compacto"
        onClick={() => void copiar(valor, `${etiqueta} copiado`)}
        aria-label={`Copiar ${etiqueta.toLowerCase()}`}
        className="shrink-0"
      >
        Copiar
      </Button>
    </div>
  )
}
