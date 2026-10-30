import { cn } from '@/shared/lib/cn'
import type { SlotDisponibilidad } from '../types'
import { esSlotSeleccionable, etiquetaEstadoSlot } from '../domain/horarios'

export interface SlotButtonProps {
  slot: SlotDisponibilidad
  seleccionado: boolean
  onSeleccionar: (horaInicio: string | null) => void
}

export function SlotButton({ slot, seleccionado, onSeleccionar }: SlotButtonProps) {
  const libre = esSlotSeleccionable(slot.estado)
  const visual = slot.estado
  const etiqueta = etiquetaEstadoSlot(slot.estado)

  const clases = seleccionado
    ? 'border-accent bg-accent text-ink'
    : visual === 'verde'
      ? 'border-green-40 bg-green-10 text-green hover:bg-green-20'
      : visual === 'naranja'
        ? 'border-amber-30 bg-amber-10 text-amber-70'
        : 'border-red-30 bg-red-10 text-red-60 line-through'

  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      aria-disabled={!libre || undefined}
      aria-label={`${slot.horaInicio}, ${etiqueta}`}
      onClick={() => {
        if (!libre) return
        onSeleccionar(seleccionado ? null : slot.horaInicio)
      }}
      className={cn(
        'type-small flex min-h-[var(--height-button-slot)] items-center justify-center rounded-[var(--radius-button-slot)] border px-1 font-mono transition-colors',
        clases,
        !libre && 'cursor-not-allowed',
      )}
    >
      {slot.horaInicio}
    </button>
  )
}
