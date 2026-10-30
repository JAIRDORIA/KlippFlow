import { fechaLarga } from '@/shared/lib/fechas'
import { cn } from '@/shared/lib/cn'
import type { DiaSeleccionable } from '../domain/dias'

export interface DiaSelectorProps {
  dias: readonly DiaSeleccionable[]
  valor: string
  onCambio: (fecha: string) => void
}

export function DiaSelector({ dias, valor, onCambio }: DiaSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Día de la cita"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {dias.map((dia) => {
        const seleccionado = dia.fecha === valor
        return (
          <button
            key={dia.fecha}
            type="button"
            aria-pressed={seleccionado}
            aria-label={fechaLarga(dia.fecha)}
            onClick={() => onCambio(dia.fecha)}
            className={cn(
              'flex min-h-[var(--height-button-slot)] min-w-[48px] shrink-0 flex-col items-center justify-center rounded-[var(--radius-button-slot)] border px-2 py-1 transition-colors',
              seleccionado
                ? 'border-accent bg-accent text-ink'
                : 'border-line bg-card-50 text-secondary hover:border-accent-40',
            )}
          >
            <span className="type-eyebrow text-inherit">{dia.diaSemana}</span>
            <span className="font-mono text-[var(--font-size-calendar-day)] leading-none">
              {dia.dia}
            </span>
          </button>
        )
      })}
    </div>
  )
}
