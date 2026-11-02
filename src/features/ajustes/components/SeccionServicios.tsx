import { ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ordenarServicios, textoDuracion, textoPrecio } from '@/features/ajustes/domain/servicios'
import { useServicios } from '@/features/ajustes/hooks'
import type { Servicio } from '@/features/ajustes/types'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Skeleton } from '@/shared/ui/Skeleton'
import { SheetServicio } from './SheetServicio'

/** Lista "Servicios" con crear, editar, desactivar y reactivar. */
export function SeccionServicios() {
  const { data, isPending, isError, isFetching, refetch } = useServicios()
  const [sheet, setSheet] = useState<{ servicio: Servicio | null } | null>(null)

  const cerrar = useCallback(() => setSheet(null), [])
  const servicios = ordenarServicios(data ?? [])

  return (
    <section className="mt-9">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-card-title">Servicios</h2>
        <Button
          variante="ghost"
          tamano="compacto"
          onClick={() => setSheet({ servicio: null })}
        >
          + Nuevo
        </Button>
      </div>

      {isPending && (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-[56px] w-full" />
          <Skeleton className="h-[56px] w-full" />
        </div>
      )}

      {isError && !data && (
        <div className="mt-3">
          <EstadoError
            mensaje="No pudimos cargar tus servicios. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {data && servicios.length === 0 && (
        <EmptyState
          className="mt-3"
          titulo="Aún no tienes servicios"
          descripcion="Sin servicios activos nadie puede reservar."
          accion={
            <Button tamano="compacto" onClick={() => setSheet({ servicio: null })}>
              + Nuevo servicio
            </Button>
          }
        />
      )}

      {servicios.length > 0 && (
        <ul className="mt-1">
          {servicios.map((servicio) => (
            <li key={servicio.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setSheet({ servicio })}
                className="kf-press flex min-h-[var(--height-button)] w-full items-center gap-3 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'type-small block truncate',
                      servicio.activo ? 'text-text' : 'text-secondary',
                    )}
                  >
                    {servicio.nombre}
                  </span>
                  <span
                    className={cn(
                      'type-helper block font-mono',
                      servicio.activo ? 'text-secondary' : 'text-dim',
                    )}
                  >
                    {textoDuracion(servicio.duracionMinutos)} ·{' '}
                    {textoPrecio(servicio.precio)}
                  </span>
                </span>

                {!servicio.activo && <Chip variante="neutro">Inactivo</Chip>}

                <ChevronRight
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.6}
                  className="shrink-0 text-dim"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SheetServicio
        abierto={sheet !== null}
        servicio={sheet?.servicio ?? null}
        onCerrar={cerrar}
      />
    </section>
  )
}
