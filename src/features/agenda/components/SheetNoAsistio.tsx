import { TriangleAlert } from 'lucide-react'
import { nombreCliente } from '@/features/agenda/domain/agenda'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import { useMarcarNoAsistio } from '@/features/agenda/hooks'
import type { CitaBarbero } from '@/features/agenda/types'
import { etiquetaDia, hora12 } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetNoAsistioProps {
  cita: CitaBarbero | null
  onCerrar: () => void
}

/** Confirmación "¿Marcar como no asistió?" (DISENO.md 6.5). */
export function SheetNoAsistio({ cita, onCerrar }: SheetNoAsistioProps) {
  return (
    <Sheet
      abierto={cita !== null}
      onCerrar={onCerrar}
      titulo="¿Marcar como no asistió?"
      descripcion={
        cita
          ? `${nombreCliente(cita)} · ${etiquetaDia(cita.fecha)} · ${hora12(cita.horaInicio)}`
          : undefined
      }
    >
      {cita && <ContenidoNoAsistio key={cita.id} cita={cita} onCerrar={onCerrar} />}
    </Sheet>
  )
}

function ContenidoNoAsistio({
  cita,
  onCerrar,
}: {
  cita: CitaBarbero
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const mutacion = useMarcarNoAsistio()

  function confirmar(): void {
    if (mutacion.isPending) return

    mutacion.mutate(cita.id, {
      onSuccess: (respuesta) => {
        mostrarToast({
          mensaje: 'Marcada como no asistió.',
          duracionMs: 8000,
          accion: respuesta.whatsappUrl
            ? { etiqueta: 'Avisar', href: respuesta.whatsappUrl }
            : undefined,
        })
        onCerrar()
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)]">
        <TriangleAlert
          aria-hidden="true"
          size={18}
          strokeWidth={1.6}
          className="mt-0.5 shrink-0 text-amber"
        />
        <p className="type-aux text-amber">
          Esta acción no se puede deshacer. La cita quedará como no asistió y no
          suma al balance del día.
        </p>
      </div>

      {mutacion.isError && (
        <p role="alert" className="type-helper text-red">
          {mensajeDeError('noAsistio', mutacion.error).mensaje}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variante="danger"
          onClick={confirmar}
          disabled={mutacion.isPending}
          aria-disabled={mutacion.isPending || undefined}
          cargando={mutacion.isPending}
          className="w-full"
        >
          Marcar como no asistió
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Volver
        </Button>
      </div>
    </div>
  )
}
