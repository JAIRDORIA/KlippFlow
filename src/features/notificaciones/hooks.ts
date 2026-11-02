import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorPeticion } from '@/shared/api/client'
import { useToast } from '@/shared/ui/toast-context'
import { cancelarPush, obtenerLlavePublica, suscribirPush } from './api'
import { ErrorNotificaciones, mensajeDeErrorNotificaciones } from './domain/errores'
import {
  detectarDispositivo,
  leerEntornoDispositivo,
  leerPermiso,
  type DeteccionDispositivo,
  type Plataforma,
} from './domain/plataforma'
import { clavesDeSuscripcion } from './domain/suscripcion'
import { servicioWorkerListo } from './registro'
import { claveVapidABytes } from './domain/vapid'
import type {
  EstadoNotificaciones,
  PermisoNotificaciones,
} from './types'

export interface UseNotificaciones {
  estado: EstadoNotificaciones
  ocupado: boolean
  error: string | null
  permiso: PermisoNotificaciones
  plataforma: Plataforma
  standalone: boolean
  soportePush: boolean
  /** Solo debe llamarse desde un clic: el permiso se pide ahí. */
  activar: () => Promise<void>
  desactivar: () => Promise<void>
  reintentar: () => void
}

function calcularEstadoBase(
  deteccion: DeteccionDispositivo,
  permiso: PermisoNotificaciones,
): EstadoNotificaciones {
  if (deteccion.plataforma === 'ios' && !deteccion.standalone) {
    return 'requiere_instalacion'
  }
  if (!deteccion.soportePush) return 'no_soportado'
  if (permiso === 'denied') return 'denegado'
  if (permiso === 'granted') return 'activo'
  return 'permiso_pendiente'
}

/**
 * Estado y acciones de las notificaciones del barbero.
 *
 * El permiso **solo** se pide dentro de `activar()`, que se ata a un clic.
 */
export function useNotificaciones(): UseNotificaciones {
  const { mostrarToast } = useToast()
  const deteccion = useMemo(() => detectarDispositivo(leerEntornoDispositivo()), [])

  const [permiso, setPermiso] = useState<PermisoNotificaciones>(() => leerPermiso())
  const [estado, setEstado] = useState<EstadoNotificaciones>(() =>
    calcularEstadoBase(deteccion, leerPermiso()),
  )
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enCurso = useRef(false)

  // Si el permiso ya estaba concedido, comprobamos que el navegador conserve la
  // suscripción; si no, no hay nada activo todavía.
  useEffect(() => {
    if (!deteccion.soportePush) return
    if (deteccion.plataforma === 'ios' && !deteccion.standalone) return

    let vivo = true

    void (async () => {
      try {
        const registro = await servicioWorkerListo()
        const suscripcion = await registro.pushManager.getSubscription()
        if (!vivo) return

        setEstado((actual) =>
          actual === 'activo' && !suscripcion ? 'permiso_pendiente' : actual,
        )
      } catch {
        // Sin service worker disponible se mantiene el estado optimista.
      }
    })()

    return () => {
      vivo = false
    }
  }, [deteccion.plataforma, deteccion.standalone, deteccion.soportePush])

  const activar = useCallback(async (): Promise<void> => {
    if (enCurso.current) return

    enCurso.current = true
    setOcupado(true)
    setError(null)

    try {
      if (deteccion.plataforma === 'ios' && !deteccion.standalone) {
        setEstado('requiere_instalacion')
        return
      }
      if (!deteccion.soportePush || typeof Notification === 'undefined') {
        throw new ErrorNotificaciones('sin-soporte')
      }

      // Primero el permiso, sin esperas previas: así sigue siendo el gesto.
      let permisoActual = Notification.permission
      if (permisoActual === 'default') {
        permisoActual = await Notification.requestPermission()
      }
      setPermiso(permisoActual)

      if (permisoActual !== 'granted') {
        if (permisoActual === 'denied') {
          const resultado = mensajeDeErrorNotificaciones(
            new ErrorNotificaciones('permiso-denegado'),
          )
          setEstado('denegado')
          setError(resultado.mensaje)
        } else {
          setEstado('permiso_pendiente')
        }
        return
      }

      setEstado('activando')

      const llave = await obtenerLlavePublica()
      const bytes = claveVapidABytes(llave.publicKey)
      if (!bytes) {
        throw new ErrorNotificaciones(
          'suscripcion',
          'La llave pública de notificaciones no es válida.',
        )
      }

      const registro = await servicioWorkerListo()
      const existente = await registro.pushManager.getSubscription()
      const suscripcion =
        existente ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }))

      const cuerpo = clavesDeSuscripcion(suscripcion)
      if (!cuerpo) throw new ErrorNotificaciones('suscripcion')

      await suscribirPush(cuerpo)

      setEstado('activo')
      mostrarToast({ mensaje: 'Notificaciones activadas', duracionMs: 4000 })
    } catch (fallo) {
      const resultado = mensajeDeErrorNotificaciones(fallo)
      setEstado(resultado.estado)
      setError(resultado.mensaje)
    } finally {
      enCurso.current = false
      setOcupado(false)
    }
  }, [deteccion, mostrarToast])

  const desactivar = useCallback(async (): Promise<void> => {
    if (enCurso.current) return

    enCurso.current = true
    setOcupado(true)
    setError(null)

    try {
      if (!deteccion.soportePush) throw new ErrorNotificaciones('sin-soporte')

      const registro = await servicioWorkerListo()
      const suscripcion = await registro.pushManager.getSubscription()

      if (suscripcion) {
        try {
          await cancelarPush(suscripcion.endpoint)
        } catch (fallo) {
          // 404: ya no existía en el backend, se sigue con la baja local.
          if (!(fallo instanceof ErrorPeticion) || fallo.status !== 404) throw fallo
        }
        await suscripcion.unsubscribe()
      }

      setEstado('permiso_pendiente')
      mostrarToast({ mensaje: 'Notificaciones desactivadas', duracionMs: 4000 })
    } catch (fallo) {
      const resultado = mensajeDeErrorNotificaciones(fallo)
      setEstado(resultado.estado)
      setError(resultado.mensaje)
    } finally {
      enCurso.current = false
      setOcupado(false)
    }
  }, [deteccion, mostrarToast])

  const reintentar = useCallback((): void => {
    setError(null)
    setEstado(calcularEstadoBase(deteccion, leerPermiso()))
  }, [deteccion])

  return {
    estado,
    ocupado,
    error,
    permiso,
    plataforma: deteccion.plataforma,
    standalone: deteccion.standalone,
    soportePush: deteccion.soportePush,
    activar,
    desactivar,
    reintentar,
  }
}
