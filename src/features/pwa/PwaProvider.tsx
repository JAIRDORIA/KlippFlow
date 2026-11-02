import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSinConexion } from '@/shared/lib/useSinConexion'
import { AvisoSinConexion } from '@/shared/ui/AvisoSinConexion'
import { AvisoVersionNueva } from '@/shared/ui/AvisoVersionNueva'
import { debeComprobarActualizacion } from './domain/actualizacion'
import { registrarServiceWorker, type Actualizador } from './registroSw'

/**
 * Registro del service worker y avisos de PWA.
 *
 * - El service worker nuevo se instala en segundo plano y espera: **nunca** se
 *   recarga la app sola (podría haber un formulario o un sheet a medias).
 * - "Actualizar" activa el service worker nuevo y recarga.
 * - Al volver a la app (foco o pestaña visible) se busca una versión nueva como
 *   mucho una vez cada 30 minutos.
 * - Los manejadores de push del service worker no dependen de esto, así que la
 *   actualización no toca la suscripción.
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  const [versionNueva, setVersionNueva] = useState(false)
  const [descartada, setDescartada] = useState(false)

  const actualizador = useRef<Actualizador | null>(null)
  const registro = useRef<ServiceWorkerRegistration | null>(null)
  const ultimaComprobacion = useRef<number | null>(null)

  const sinConexion = useSinConexion()

  useEffect(() => {
    actualizador.current = registrarServiceWorker({
      alNecesitarActualizar: () => setVersionNueva(true),
      alRegistrar: (serviceWorker) => {
        registro.current = serviceWorker ?? null
      },
      alFallar: (error) => {
        console.error('[KlippFlow] No se pudo registrar el service worker', error)
      },
    })
  }, [])

  useEffect(() => {
    function comprobar() {
      const ahora = Date.now()
      if (!debeComprobarActualizacion(ultimaComprobacion.current, ahora)) return
      ultimaComprobacion.current = ahora

      const actual = registro.current
      if (!actual) return
      void actual.update().catch(() => undefined)
    }

    function alCambiarVisibilidad() {
      if (document.visibilityState === 'visible') comprobar()
    }

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    window.addEventListener('focus', comprobar)

    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      window.removeEventListener('focus', comprobar)
    }
  }, [])

  const actualizar = useCallback(() => {
    const aplicar = actualizador.current
    if (!aplicar) {
      window.location.reload()
      return
    }
    void aplicar(true)
  }, [])

  return (
    <>
      {children}

      <AvisoVersionNueva
        visible={versionNueva && !descartada}
        onActualizar={actualizar}
        onDescartar={() => setDescartada(true)}
      />

      <AvisoSinConexion visible={sinConexion} />
    </>
  )
}
