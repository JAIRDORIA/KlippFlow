import type { SuscripcionPush } from '../types'

/**
 * Convierte la `PushSubscription` del navegador al cuerpo que documenta
 * `POST /barbero/push/suscripciones`: `{ endpoint, keys: { p256dh, auth } }`.
 *
 * Devuelve null si el navegador no expone alguna de las llaves (no se puede
 * suscribir sin ellas).
 */
export function clavesDeSuscripcion(
  suscripcion: PushSubscription,
): SuscripcionPush | null {
  const datos = suscripcion.toJSON()
  const endpoint = datos.endpoint ?? suscripcion.endpoint
  const p256dh = datos.keys?.p256dh
  const auth = datos.keys?.auth

  if (!endpoint || !p256dh || !auth) return null

  return { endpoint, keys: { p256dh, auth } }
}
