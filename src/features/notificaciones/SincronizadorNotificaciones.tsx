import { useEffect } from 'react'
import { registrarAntesDeCerrarSesion } from '@/features/auth/antesDeCerrarSesion'
import { useAuth } from '@/features/auth/useAuth'
import { detectarDispositivo, leerEntornoDispositivo } from './domain/plataforma'
import {
  cancelarSuscripcionAlCerrarSesion,
  sincronizarSuscripcion,
} from './sincronizacion'

/**
 * Re-sincroniza la suscripción push al entrar (silencioso e idempotente) y la da
 * de baja en el backend al cerrar sesión, sin bloquear el cierre si falla.
 */
export function SincronizadorNotificaciones() {
  const { estaAutenticado } = useAuth()

  useEffect(
    () => registrarAntesDeCerrarSesion(cancelarSuscripcionAlCerrarSesion),
    [],
  )

  useEffect(() => {
    if (!estaAutenticado) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return
    }

    const deteccion = detectarDispositivo(leerEntornoDispositivo())
    if (!deteccion.soportePush) return
    if (deteccion.plataforma === 'ios' && !deteccion.standalone) return

    void sincronizarSuscripcion()
  }, [estaAutenticado])

  return null
}
