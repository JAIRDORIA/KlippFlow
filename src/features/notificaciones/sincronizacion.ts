import { cancelarPush, suscribirPush } from './api'
import { clavesDeSuscripcion } from './domain/suscripcion'
import type { ZonaPush } from './types'

/**
 * Re-sincronización silenciosa de la suscripción.
 *
 * El POST es idempotente y reasigna el `endpoint` al dueño del token, así que
 * al abrir la app con permiso concedido se vuelve a enviar la suscripción
 * existente. Cubre el cambio de usuario en el mismo dispositivo y las
 * suscripciones que el backend borró por caducadas.
 */
export async function sincronizarSuscripcion(
  zona: ZonaPush = 'barbero',
): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const registro = await navigator.serviceWorker.ready
    const suscripcion = await registro.pushManager.getSubscription()
    if (!suscripcion) return

    const cuerpo = clavesDeSuscripcion(suscripcion)
    if (!cuerpo) return

    await suscribirPush(cuerpo, zona)
  } catch {
    // Silencioso: se reintenta en la siguiente apertura.
  }
}

/**
 * Al cerrar sesión se da de baja la suscripción en el backend, pero **no** se
 * anula la del navegador: así el siguiente usuario en este equipo la recupera
 * sin volver a tocar "Activar". Un 404 o cualquier error no bloquea el cierre.
 */
export async function cancelarSuscripcionAlCerrarSesion(
  zona: ZonaPush = 'barbero',
): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const registro = await navigator.serviceWorker.ready
    const suscripcion = await registro.pushManager.getSubscription()
    if (!suscripcion) return

    await cancelarPush(suscripcion.endpoint, zona)
  } catch {
    // Nunca bloquea el cierre de sesión.
  }
}
