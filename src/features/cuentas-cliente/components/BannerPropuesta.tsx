import { Clock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { mapearErrorCambioHora } from '../domain/errores'
import { fechaCitaLegible, horaCitaLegible } from '../domain/citas'
import { useAceptarCambioHora, useRechazarCambioHora } from '../hooks'
import type { CitaClienteDetalle } from '../types'
import {
  calcularCuentaPropuesta,
  estaVigente,
} from '@/shared/lib/propuestaCambioHora'
import { useAhora } from '@/shared/lib/useAhora'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { useToast } from '@/shared/ui/toast-context'

export interface BannerPropuestaProps {
  cita: CitaClienteDetalle
  /** Se llama una sola vez cuando la cuenta regresiva local llega a cero. */
  onExpirada?: () => void
}

/**
 * Banner "Nueva hora propuesta" del detalle de una cita.
 *
 * Muestra la hora nueva, la anterior, el tiempo restante y las acciones.
 * Fuente: `docs/backend/CAMBIO_HORA.md`.
 */
export function BannerPropuesta({ cita, onExpirada }: BannerPropuestaProps) {
  const propuesta = cita.propuestaCambioHora
  const ahora = useAhora(30_000)
  const { mostrarToast } = useToast()
  const aceptar = useAceptarCambioHora()
  const rechazar = useRechazarCambioHora()
  const yaAvisoVencida = useRef(false)

  const cuenta = calcularCuentaPropuesta(propuesta, ahora)
  const vigente = estaVigente(propuesta, ahora)

  useEffect(() => {
    if (!propuesta || vigente || yaAvisoVencida.current) return
    yaAvisoVencida.current = true
    onExpirada?.()
  }, [propuesta, vigente, onExpirada])

  if (!propuesta) return null

  const pendiente = aceptar.isPending || rechazar.isPending

  function alAceptar(): void {
    if (pendiente) return
    aceptar.mutate(cita.id, {
      onSuccess: () => {
        mostrarToast({
          mensaje: 'Cita confirmada en la nueva hora.',
          duracionMs: 8000,
        })
      },
      onError: (fallo) => {
        mostrarToast({ mensaje: mapearErrorCambioHora(fallo), duracionMs: 8000 })
      },
    })
  }

  function alRechazar(): void {
    if (pendiente) return
    const veniaPendiente = cita.estado === 'pendiente'
    rechazar.mutate(cita.id, {
      onSuccess: () => {
        mostrarToast({
          mensaje: veniaPendiente
            ? 'Tu solicitud quedó rechazada.'
            : 'Mantienes tu hora original.',
          duracionMs: 8000,
        })
      },
      onError: (fallo) => {
        mostrarToast({ mensaje: mapearErrorCambioHora(fallo), duracionMs: 8000 })
      },
    })
  }

  return (
    <Card className="flex flex-col gap-3 border-accent-40">
      <div className="flex items-start justify-between gap-3">
        <p className="type-eyebrow">NUEVA HORA PROPUESTA</p>
        <Chip variante={vigente ? 'ambar' : 'neutro'}>
          {vigente ? 'Esperando tu respuesta' : 'Propuesta expirada'}
        </Chip>
      </div>

      <p className="type-card-title font-mono tabular-nums">
        {fechaCitaLegible(propuesta.fecha)} · {horaCitaLegible(propuesta.horaInicio)}{' '}
        – {horaCitaLegible(propuesta.horaFin)}
      </p>

      <p className="type-small text-secondary">
        Antes: {fechaCitaLegible(cita.fecha)} · {horaCitaLegible(cita.horaInicio)}{' '}
        – {horaCitaLegible(cita.horaFin)}
      </p>

      {cuenta && (
        <p className="type-helper inline-flex items-center gap-1.5 text-amber" aria-live="polite">
          <Clock aria-hidden="true" size={14} strokeWidth={1.6} />
          {cuenta.texto}
        </p>
      )}

      {vigente ? (
        <div className="flex gap-2">
          <Button
            variante="ghost"
            onClick={alRechazar}
            disabled={pendiente}
            aria-disabled={pendiente || undefined}
            cargando={rechazar.isPending}
            className="flex-1"
          >
            Rechazar
          </Button>
          <Button
            onClick={alAceptar}
            disabled={pendiente}
            aria-disabled={pendiente || undefined}
            cargando={aceptar.isPending}
            className="flex-1"
          >
            Aceptar
          </Button>
        </div>
      ) : (
        <p className="type-helper text-secondary">
          Ya no se puede responder esta propuesta. Actualizamos tu cita en un momento.
        </p>
      )}
    </Card>
  )
}
