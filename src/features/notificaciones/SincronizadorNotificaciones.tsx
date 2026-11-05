import { useEffect } from 'react'
import { registrarAntesDeCerrarSesion } from '@/features/auth/antesDeCerrarSesion'
import { useAuth } from '@/features/auth/useAuth'
import {
  detectarDispositivo,
  estadoPermiso,
  leerEntornoDispositivo,
} from './domain/plataforma'
import {
  cancelarSuscripcionAlCerrarSesion,
  sincronizarSuscripcion,
} from './sincronizacion'
import type { ZonaPush } from './types'

export interface SincronizadorNotificacionesProps {
  rol: ZonaPush
}

/**
 * Re-sincroniza la suscripción push al entrar (silencioso e idempotente) y la da
 * de baja en el backend al cerrar sesión, sin bloquear el cierre si falla.
 *
 * Se monta una vez por zona con su rol: barbero y cliente usan endpoints
 * distintos y nunca comparten la baja.
 */
export function SincronizadorNotificaciones({
  rol,
}: SincronizadorNotificacionesProps) {
  const { tipo } = useAuth()

  useEffect(() => {
    if (tipo !== rol) return
    return registrarAntesDeCerrarSesion(() =>
      cancelarSuscripcionAlCerrarSesion(rol),
    )
  }, [rol, tipo])

  useEffect(() => {
    if (tipo !== rol) return
    if (estadoPermiso() !== 'granted') return

    const deteccion = detectarDispositivo(leerEntornoDispositivo())
    if (!deteccion.soportePush) return
    if (deteccion.plataforma === 'ios' && !deteccion.standalone) return

    void sincronizarSuscripcion(rol)
  }, [rol, tipo])

  return null
}
