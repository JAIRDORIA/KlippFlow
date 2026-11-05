import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { cargarGoogleIdentity, getGoogleClientId } from '../google'

export interface BotonGoogleProps {
  onCredential: (idToken: string) => void
  deshabilitado?: boolean
  className?: string
}

type EstadoGoogle = 'cargando' | 'listo' | 'no-disponible'

export function BotonGoogle({
  onCredential,
  deshabilitado = false,
  className,
}: BotonGoogleProps) {
  const clientId = getGoogleClientId()
  const contenedor = useRef<HTMLDivElement>(null)
  const credencialRef = useRef(onCredential)
  const [estado, setEstado] = useState<EstadoGoogle>(
    clientId ? 'cargando' : 'no-disponible',
  )

  useEffect(() => {
    credencialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return

    let cancelado = false

    void cargarGoogleIdentity()
      .then(() => {
        if (cancelado) return
        const api = window.google?.accounts?.id
        const nodo = contenedor.current
        if (!api || !nodo) {
          setEstado('no-disponible')
          return
        }

        api.initialize({
          client_id: clientId,
          callback: (respuesta) => {
            if (respuesta.credential) {
              credencialRef.current(respuesta.credential)
            }
          },
          locale: 'es',
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        nodo.replaceChildren()
        api.renderButton(nodo, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(400, Math.max(200, nodo.clientWidth || 300)),
        })
        setEstado('listo')
      })
      .catch(() => {
        if (!cancelado) setEstado('no-disponible')
      })

    return () => {
      cancelado = true
    }
  }, [clientId])

  if (estado === 'no-disponible') {
    return (
      <p
        role="status"
        className={cn(
          'type-small rounded-[var(--radius-warning)] border border-line bg-card px-[var(--space-warning)] py-[var(--space-warning)] text-center text-secondary',
          className,
        )}
      >
        Inicio con Google no disponible
      </p>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-[var(--height-button)] w-full items-center justify-center',
        deshabilitado && 'pointer-events-none opacity-[var(--opacity-disabled)]',
        className,
      )}
      aria-busy={estado === 'cargando' || undefined}
    >
      <div ref={contenedor} className="flex w-full justify-center" />
      {estado === 'cargando' && (
        <span className="sr-only">Cargando inicio con Google</span>
      )}
    </div>
  )
}
