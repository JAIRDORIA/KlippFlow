import { useId, useState } from 'react'
import { nombreCliente } from '@/features/agenda/domain/agenda'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import { MOTIVO_MAXIMO, validarMotivoCancelacion } from '@/features/agenda/domain/propina'
import type { CitaBarbero } from '@/features/agenda/types'
import { useCancelarCita } from '@/features/agenda/hooks'
import { etiquetaDia, hora12 } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetCancelarCitaProps {
  cita: CitaBarbero | null
  onCerrar: () => void
}

/** Sheet "Cancelar cita" (DISENO.md 6.5). */
export function SheetCancelarCita({ cita, onCerrar }: SheetCancelarCitaProps) {
  return (
    <Sheet
      abierto={cita !== null}
      onCerrar={onCerrar}
      titulo="Cancelar cita"
      descripcion={
        cita
          ? `${nombreCliente(cita)} · ${etiquetaDia(cita.fecha)} · ${hora12(cita.horaInicio)}`
          : undefined
      }
    >
      {cita && <ContenidoCancelar key={cita.id} cita={cita} onCerrar={onCerrar} />}
    </Sheet>
  )
}

function ContenidoCancelar({
  cita,
  onCerrar,
}: {
  cita: CitaBarbero
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const mutacion = useCancelarCita()
  const idCampo = useId()

  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validacion = validarMotivoCancelacion(motivo)
  const pendiente = mutacion.isPending

  function confirmar(): void {
    if (pendiente || !validacion.valido) return

    setError(null)
    mutacion.mutate(
      { id: cita.id, motivo: validacion.motivo || undefined },
      {
        onSuccess: (respuesta) => {
          mostrarToast({
            mensaje: 'Cita cancelada.',
            duracionMs: 8000,
            accion: respuesta.whatsappUrl
              ? { etiqueta: 'Avisar', href: respuesta.whatsappUrl }
              : undefined,
          })
          onCerrar()
        },
        onError: (fallo) => setError(mensajeDeError('cancelar', fallo).mensaje),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-[var(--space-gap-sm)]">
        <label htmlFor={idCampo} className="type-label">
          Motivo (opcional)
        </label>
        <textarea
          id={idCampo}
          value={motivo}
          maxLength={MOTIVO_MAXIMO}
          rows={3}
          onChange={(evento) => setMotivo(evento.target.value)}
          placeholder="Se enfermó el barbero"
          className="type-form w-full resize-none rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] py-[var(--space-gap)] text-text placeholder:text-dim focus:border-accent-60"
        />
        <p className="type-helper font-mono" aria-live="polite">
          {motivo.length}/{MOTIVO_MAXIMO}
        </p>
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
          disabled={pendiente || !validacion.valido}
          aria-disabled={pendiente || !validacion.valido || undefined}
          cargando={pendiente}
          className="w-full"
        >
          Cancelar cita
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Volver
        </Button>
      </div>
    </div>
  )
}
