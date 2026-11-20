import { useMemo, useState } from 'react'
import { nombreCliente } from '@/features/agenda/domain/agenda'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import {
  useDisponibilidadCambioHora,
  useProponerCambioHora,
} from '@/features/agenda/hooks'
import type { CitaBarbero } from '@/features/agenda/types'
import { DiaSelector } from '@/features/reserva-publica/components/DiaSelector'
import { SlotButton } from '@/features/reserva-publica/components/SlotButton'
import { generarDiasDisponibles } from '@/features/reserva-publica/domain/dias'
import {
  esSlotSeleccionable,
} from '@/features/reserva-publica/domain/horarios'
import { etiquetaDia, hora12, hoyBogota } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetProponerHoraProps {
  cita: CitaBarbero | null
  onCerrar: () => void
}

/**
 * Sheet "Proponer otra hora".
 *
 * Reutiliza la tira de días y los slots de la reserva pública: el backend
 * devuelve la misma forma (`verde/naranja/rojo`) y excluye la propia cita de
 * las ocupaciones (`docs/backend/CAMBIO_HORA.md`).
 */
export function SheetProponerHora({ cita, onCerrar }: SheetProponerHoraProps) {
  return (
    <Sheet
      abierto={cita !== null}
      onCerrar={onCerrar}
      titulo="Proponer otra hora"
      descripcion={
        cita
          ? `${nombreCliente(cita)} · ${etiquetaDia(cita.fecha)} · ${hora12(cita.horaInicio)}`
          : undefined
      }
    >
      {cita && <ContenidoProponer key={cita.id} cita={cita} onCerrar={onCerrar} />}
    </Sheet>
  )
}

function ContenidoProponer({
  cita,
  onCerrar,
}: {
  cita: CitaBarbero
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const mutacion = useProponerCambioHora()
  const dias = useMemo(() => generarDiasDisponibles(hoyBogota()), [])

  const [fecha, setFecha] = useState(() => {
    const inicial = dias.some((dia) => dia.fecha === cita.fecha)
      ? cita.fecha
      : dias[0]?.fecha
    return inicial ?? hoyBogota()
  })
  const [hora, setHora] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const consulta = useDisponibilidadCambioHora(cita.id, fecha)
  const slots = consulta.data?.slots ?? []
  const pendiente = mutacion.isPending

  // Si la última consulta ya no trae el slot elegido (se ocupó), no se puede enviar.
  const horaElegible =
    hora !== null &&
    slots.some(
      (slot) => slot.horaInicio === hora && esSlotSeleccionable(slot.estado),
    )

  function cambiarFecha(nueva: string): void {
    setFecha(nueva)
    setHora(null)
    setError(null)
  }

  function proponer(): void {
    if (pendiente || !hora || !horaElegible) return

    setError(null)
    mutacion.mutate(
      { id: cita.id, fecha, horaInicio: hora },
      {
        onSuccess: (respuesta) => {
          mostrarToast({
            mensaje: 'Propuesta enviada. El cliente tiene 1 hora para responder.',
            duracionMs: 8000,
            accion: respuesta.whatsappUrl
              ? { etiqueta: 'Avisar', href: respuesta.whatsappUrl }
              : undefined,
          })
          onCerrar()
        },
        onError: (fallo) => setError(mensajeDeError('proponerCambioHora', fallo).mensaje),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-small text-secondary">
        Hora actual:{' '}
        <span className="font-mono tabular-nums text-text">
          {etiquetaDia(cita.fecha)} · {hora12(cita.horaInicio)} – {hora12(cita.horaFin)}
        </span>
      </p>

      {cita.propuestaCambioHora && (
        <p className="type-helper rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber">
          Ya hay una propuesta esperando respuesta. Si envías otra, reemplaza la
          anterior y se avisa de nuevo al cliente.
        </p>
      )}

      <DiaSelector dias={dias} valor={fecha} onCambio={cambiarFecha} />

      {consulta.isPending ? (
        <div>
          <div className="grid grid-cols-4 gap-2" aria-hidden="true">
            {Array.from({ length: 8 }, (_, indice) => (
              <Skeleton key={indice} className="h-[var(--height-button-slot)]" />
            ))}
          </div>
          <span className="sr-only">Cargando horarios</span>
        </div>
      ) : consulta.isError ? (
        <EmptyState
          titulo="No pudimos cargar los horarios"
          descripcion="Revisa tu conexión e inténtalo de nuevo."
          accion={
            <Button tamano="compacto" onClick={() => void consulta.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : slots.length === 0 ? (
        <EmptyState titulo="Este día no tiene horarios disponibles" />
      ) : (
        <>
          <p className="type-helper">
            Duración de la cita ·{' '}
            <span className="font-mono text-text">
              {consulta.data?.duracionMinutos ?? 0} min
            </span>
          </p>

          <div
            className="grid grid-cols-4 gap-2"
            role="group"
            aria-label="Horarios disponibles para reprogramar"
          >
            {slots.map((slot) => (
              <SlotButton
                key={slot.horaInicio}
                slot={slot}
                seleccionado={horaElegible && hora === slot.horaInicio}
                onSeleccionar={setHora}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="type-helper flex items-center gap-2">
              <span className="size-2 rounded-full bg-green" aria-hidden="true" />
              Libre
            </span>
            <span className="type-helper flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber" aria-hidden="true" />
              Por confirmar
            </span>
            <span className="type-helper flex items-center gap-2">
              <span className="size-2 rounded-full bg-red" aria-hidden="true" />
              Ocupado
            </span>
          </div>

          {hora && !horaElegible && (
            <p role="status" className="type-helper text-amber">
              Ese horario dejó de estar libre. Elige otro.
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={proponer}
          disabled={pendiente || !horaElegible}
          aria-disabled={pendiente || !horaElegible || undefined}
          cargando={pendiente}
          className="w-full"
        >
          Proponer esta hora
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Volver
        </Button>
      </div>
    </div>
  )
}
