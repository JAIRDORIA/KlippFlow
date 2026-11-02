import { cancelarPush, suscribirPush } from './api'
import { clavesDeSuscripcion } from './domain/suscripcion'

/**
 * Re-sincronización silenciosa de la suscripción.
 *
 * `POST /barbero/push/suscripciones` es idempotente y reasigna el `endpoint` al
 * barbero del token, así que al abrir la app con permiso concedido se vuelve a
 * enviar la suscripción existente. Cubre el caso de dos barberos en el mismo
 * dispositivo y las suscripciones que el backend borró por caducadas.
 */
export async function sincronizarSuscripcion(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const registro = await navigator.serviceWorker.ready
    const suscripcion = await registro.pushManager.getSubscription()
    if (!suscripcion) return

    const cuerpo = clavesDeSuscripcion(suscripcion)
    if (!cuerpo) return

    await suscribirPush(cuerpo)
  } catch {
    // Silencioso: se reintenta en la siguiente apertura.
  }
}

/**
 * Al cerrar sesión se da de baja la suscripción en el backend, pero **no** se
 * anula la del navegador: así el barbero que entre después en este equipo la
 * recupera sin volver a tocar "Activar".
 */
export async function cancelarSuscripcionAlCerrarSesion(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const registro = await navigator.serviceWorker.ready
    const suscripcion = await registro.pushManager.getSubscription()
    if (!suscripcion) return

    await cancelarPush(suscripcion.endpoint)
  } catch {
    // Nunca bloquea el cierre de sesión.
  }
}
