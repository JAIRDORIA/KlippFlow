import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatearDuracion } from '@/shared/lib/format'
import { Money } from '@/shared/ui/Money'
import type { ServicioPublico } from '../types'

export interface TarjetaServicioProps {
  servicio: ServicioPublico
  seleccionado: boolean
  onAlternar: () => void
}

export function TarjetaServicio({
  servicio,
  seleccionado,
  onAlternar,
}: TarjetaServicioProps) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={onAlternar}
      className={cn(
        'w-full rounded-[var(--radius-card)] border p-[var(--space-card-agenda)] text-left transition-colors',
        seleccionado
          ? 'border-accent bg-card'
          : 'border-line bg-card-50 hover:border-accent-40',
      )}
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-[var(--radius-card-financial)] shrink-0 items-center justify-center rounded-[var(--radius-pill)] border',
            seleccionado
              ? 'border-accent bg-accent text-ink'
              : 'border-white-20 text-transparent',
          )}
        >
          <Check size={14} strokeWidth={1.6} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="type-form font-medium break-words text-text">
              {servicio.nombre}
            </span>
            <Money monto={servicio.precio} className="shrink-0" />
          </span>

          {servicio.descripcion && (
            <span className="type-aux mt-1 block text-secondary">
              {servicio.descripcion}
            </span>
          )}

          <span className="type-helper mt-2 block">
            {formatearDuracion(servicio.duracionMinutos, { estilo: 'servicio' })}
          </span>
        </span>
      </span>
    </button>
  )
}
