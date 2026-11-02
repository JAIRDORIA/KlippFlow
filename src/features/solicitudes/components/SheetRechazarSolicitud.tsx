import { useState } from 'react'
import type { MotivoRechazo, Solicitud } from '@/features/agenda/types'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import { nombreCliente } from '@/features/agenda/domain/agenda'
import { useRechazarSolicitud } from '@/features/agenda/hooks'
import { etiquetaFechaSolicitud } from '@/features/solicitudes/domain/fecha'
import { cn } from '@/shared/lib/cn'
import { hora12 } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetRechazarSolicitudProps {
  solicitud: Solicitud | null
  onCerrar: () => void
}

const OPCIONES: ReadonlyArray<{ valor: MotivoRechazo; etiqueta: string }> = [
  { valor: 'horario_ocupado', etiqueta: 'Horario ocupado' },
  { valor: 'no_disponible', etiqueta: 'No disponible' },
]

/** Sheet "Rechazar solicitud" (DISENO.md 6.5). */
export function SheetRechazarSolicitud({
  solicitud,
  onCerrar,
}: SheetRechazarSolicitudProps) {
  return (
    <Sheet
      abierto={solicitud !== null}
      onCerrar={onCerrar}
      titulo="Rechazar solicitud"
      descripcion={
        solicitud
          ? `${nombreCliente(solicitud)} · ${etiquetaFechaSolicitud(solicitud.fecha)} · ${hora12(solicitud.horaInicio)}`
          : undefined
      }
    >
      {solicitud && (
        <ContenidoRechazar
          key={solicitud.id}
          solicitud={solicitud}
          onCerrar={onCerrar}
        />
      )}
    </Sheet>
  )
}

function ContenidoRechazar({
  solicitud,
  onCerrar,
}: {
  solicitud: Solicitud
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const mutacion = useRechazarSolicitud()

  const [motivo, setMotivo] = useState<MotivoRechazo | null>(null)
  const [error, setError] = useState<string | null>(null)

  function confirmar(): void {
    if (mutacion.isPending || motivo === null) return

    setError(null)
    mutacion.mutate(
      { id: solicitud.id, motivo },
      {
        onSuccess: (respuesta) => {
          mostrarToast({
            mensaje: 'Solicitud rechazada.',
            duracionMs: 8000,
            accion: respuesta.whatsappUrl
              ? { etiqueta: 'Avisar', href: respuesta.whatsappUrl }
              : undefined,
          })
          onCerrar()
        },
        onError: (fallo) => setError(mensajeDeError('rechazar', fallo).mensaje),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Motivo del rechazo" className="flex flex-col gap-2">
        {OPCIONES.map((opcion) => {
          const elegida = motivo === opcion.valor
          return (
            <button
              key={opcion.valor}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => setMotivo(opcion.valor)}
              className={cn(
                'kf-press flex min-h-[var(--height-button)] w-full items-center gap-3 rounded-[var(--radius-card)] border px-4 text-left',
                elegida
                  ? 'border-accent bg-elevated'
                  : 'border-line bg-card-50 hover:border-white-20',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-4 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border',
                  elegida ? 'border-accent bg-accent' : 'border-dim',
                )}
              >
                {elegida && <span className="size-1.5 rounded-[var(--radius-pill)] bg-ink" />}
              </span>
              <span className="type-form font-medium text-text">{opcion.etiqueta}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variante="danger"
          onClick={confirmar}
          disabled={motivo === null || mutacion.isPending}
          aria-disabled={motivo === null || mutacion.isPending || undefined}
          cargando={mutacion.isPending}
          className="w-full"
        >
          Rechazar solicitud
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Volver
        </Button>
      </div>
    </div>
  )
}
