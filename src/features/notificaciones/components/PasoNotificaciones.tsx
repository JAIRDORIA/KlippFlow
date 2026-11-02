import { useEffect, useRef } from 'react'
import { useNotificaciones } from '../hooks'
import { Button } from '@/shared/ui/Button'

export interface PasoNotificacionesProps {
  /** Sigue a Hoy (y guarda el descarte si hace falta). */
  onContinuar: () => void
}

/**
 * Paso de notificaciones a pantalla completa (Android, escritorio o iPhone ya
 * instalado). El permiso solo se pide al pulsar "Activar notificaciones".
 */
export function PasoNotificaciones({ onContinuar }: PasoNotificacionesProps) {
  const { estado, ocupado, error, activar } = useNotificaciones()
  const pidioPermiso = useRef(false)

  useEffect(() => {
    if (estado !== 'activo' || !pidioPermiso.current) return

    const temporizador = setTimeout(onContinuar, 600)
    return () => clearTimeout(temporizador)
  }, [estado, onContinuar])

  function pedirPermiso(): void {
    pidioPermiso.current = true
    void activar()
  }

  return (
    <section className="mt-8" aria-labelledby="paso-notificaciones">
      <h2 id="paso-notificaciones" className="type-card-title">
        Activa las notificaciones
      </h2>

      {estado === 'permiso_pendiente' && (
        <p className="type-small mt-2 text-secondary">
          Te avisamos en el teléfono cada vez que entra una solicitud. El permiso se
          pide solo cuando lo tocas tú.
        </p>
      )}

      {estado === 'activo' && (
        <p className="type-small mt-2 text-text">
          Notificaciones activas. Te avisaremos cada vez que entre una solicitud.
        </p>
      )}

      {estado === 'denegado' && (
        <>
          <p className="type-small mt-2 text-text">
            Bloqueaste las notificaciones de KlippFlow en este navegador.
          </p>
          <p className="type-small mt-2 text-secondary">
            Para activarlas, ábrelas en los ajustes del navegador o del iPhone y permite
            las notificaciones de KlippFlow.
          </p>
          <p className="type-helper mt-2">
            Mientras tanto verás las solicitudes al abrir la app.
          </p>
        </>
      )}

      {estado === 'no_soportado' && (
        <>
          <p className="type-small mt-2 text-text">
            Este navegador no permite notificaciones.
          </p>
          <p className="type-small mt-2 text-secondary">
            No pasa nada: verás las solicitudes al abrir la app. En iPhone, instálala en
            la pantalla de inicio con iOS 16.4 o superior.
          </p>
        </>
      )}

      {estado === 'requiere_instalacion' && (
        <p className="type-small mt-2 text-secondary">
          En iPhone las notificaciones solo funcionan con KlippFlow en tu pantalla de
          inicio (iOS 16.4 o superior).
        </p>
      )}

      {(estado === 'permiso_pendiente' ||
        estado === 'activando' ||
        estado === 'error') && (
        <Button
          onClick={pedirPermiso}
          disabled={ocupado}
          aria-disabled={ocupado || undefined}
          cargando={ocupado || estado === 'activando'}
          className="mt-6 w-full"
        >
          {estado === 'error' ? 'Reintentar' : 'Activar notificaciones'}
        </Button>
      )}

      {estado === 'activo' && (
        <Button onClick={onContinuar} className="mt-6 w-full">
          Continuar
        </Button>
      )}

      {(estado === 'denegado' ||
        estado === 'no_soportado' ||
        estado === 'requiere_instalacion') && (
        <Button onClick={onContinuar} className="mt-6 w-full">
          Continuar
        </Button>
      )}

      <div aria-live="polite" className="mt-3">
        {estado === 'activando' && (
          <p className="type-helper text-secondary">Activando notificaciones…</p>
        )}
      </div>

      {error && (
        <p role="alert" className="type-helper mt-3 text-red">
          {error}
        </p>
      )}

      {estado !== 'activo' && (
        <Button
          variante="ghost"
          onClick={onContinuar}
          disabled={ocupado}
          className="mt-2 w-full"
        >
          Ahora no
        </Button>
      )}
    </section>
  )
}
