import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'

export interface OpcionSegmentada<T extends string> {
  valor: T
  etiqueta: string
}

export interface SegmentedProps<T extends string> {
  opciones: readonly OpcionSegmentada<T>[]
  valor: T
  onCambio: (valor: T) => void
  etiqueta: string
  className?: string
}

export function Segmented<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
  className,
}: SegmentedProps<T>) {
  const contenedor = useRef<HTMLDivElement>(null)

  function manejarTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const indiceActual = opciones.findIndex((opcion) => opcion.valor === valor)
    if (indiceActual < 0) return

    let destino: number
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
      destino = (indiceActual + 1) % opciones.length
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
      destino = (indiceActual - 1 + opciones.length) % opciones.length
    } else if (evento.key === 'Home') {
      destino = 0
    } else if (evento.key === 'End') {
      destino = opciones.length - 1
    } else {
      return
    }

    evento.preventDefault()
    const opcion = opciones[destino]
    if (!opcion) return
    onCambio(opcion.valor)
    const botones = contenedor.current?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    )
    botones?.[destino]?.focus()
  }

  return (
    <div
      ref={contenedor}
      role="radiogroup"
      aria-label={etiqueta}
      onKeyDown={manejarTeclado}
      className={cn(
        'flex h-[var(--height-segment)] gap-1 rounded-[var(--radius-segment)] border border-line bg-card p-1',
        className,
      )}
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => onCambio(opcion.valor)}
            className={cn(
              'type-form flex-1 rounded-[var(--radius-segment-option)] transition-colors',
              activa
                ? 'bg-elevated font-medium text-text shadow-sm'
                : 'text-secondary hover:text-text',
            )}
          >
            {opcion.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
