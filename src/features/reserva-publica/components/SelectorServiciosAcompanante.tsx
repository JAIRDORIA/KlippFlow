import { Check, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatearDuracion } from '@/shared/lib/format'
import { Money } from '@/shared/ui/Money'
import type { ServicioPublico } from '../types'

export interface SelectorServiciosAcompananteProps {
  numero: number
  servicioIds: readonly number[]
  catalogo: readonly ServicioPublico[]
  onAlternar: (servicioId: number) => void
  onQuitar: () => void
}

export function SelectorServiciosAcompanante({
  numero,
  servicioIds,
  catalogo,
  onAlternar,
  onQuitar,
}: SelectorServiciosAcompananteProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-[var(--space-card-agenda)]">
      <div className="flex items-start justify-between gap-3">
        <p className="type-form font-medium text-text">
          Acompañante {numero}: ¿qué se hará?
        </p>
        <button
          type="button"
          aria-label={`Quitar acompañante ${numero}`}
          onClick={onQuitar}
          className="inline-flex size-[var(--height-button-compact)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] text-secondary hover:bg-white-5 hover:text-text"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {catalogo.map((servicio) => {
          const seleccionado = servicioIds.includes(servicio.id)
          return (
            <button
              key={servicio.id}
              type="button"
              aria-pressed={seleccionado}
              onClick={() => onAlternar(servicio.id)}
              className={cn(
                'flex min-h-[var(--height-button-slot)] w-full items-center gap-3 rounded-[var(--radius-button-card)] border px-3 py-2 text-left transition-colors',
                seleccionado
                  ? 'border-accent bg-accent-20'
                  : 'border-line bg-card-50 hover:border-accent-40',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border',
                  seleccionado
                    ? 'border-accent bg-accent text-ink'
                    : 'border-white-20 text-transparent',
                )}
              >
                <Check size={12} strokeWidth={1.6} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="type-small block break-words text-text">
                  {servicio.nombre}
                </span>
                <span className="type-helper mt-0.5 flex flex-wrap items-center gap-1">
                  <Money monto={servicio.precio} />
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatearDuracion(servicio.duracionMinutos, {
                      estilo: 'servicio',
                    })}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {servicioIds.length === 0 && (
        <p className="type-helper mt-3 text-amber">Elige al menos un servicio.</p>
      )}
    </div>
  )
}
