import { peticion } from '@/shared/api/client'
import type { LlavePublica, RespuestaSuscripcion, SuscripcionPush } from './types'

/**
 * Endpoints de notificaciones push.
 * Fuente: `docs/backend/NOTIFICACIONES_PUSH.md`. Todos requieren JWT de barbero.
 */

export function obtenerLlavePublica(): Promise<LlavePublica> {
  return peticion<LlavePublica>('/barbero/push/llave-publica', { zona: 'barbero' })
}

/** Idempotente por `endpoint`: el backend reasigna la suscripción al barbero del token. */
export function suscribirPush(cuerpo: SuscripcionPush): Promise<RespuestaSuscripcion> {
  return peticion<RespuestaSuscripcion>('/barbero/push/suscripciones', {
    metodo: 'POST',
    cuerpo,
    zona: 'barbero',
  })
}

/** El endpoint identifica la suscripción; el `endpoint` va en el cuerpo. */
export async function cancelarPush(endpoint: string): Promise<void> {
  await peticion<void>('/barbero/push/suscripciones', {
    metodo: 'DELETE',
    cuerpo: { endpoint },
    zona: 'barbero',
  })
}
