import { peticion } from '@/shared/api/client'
import type {
  LlavePublicaBarbero,
  LlavePublicaCliente,
  RespuestaSuscripcion,
  SuscripcionPush,
  ZonaPush,
} from './types'

/**
 * Endpoints de notificaciones push.
 * Fuentes: `docs/backend/NOTIFICACIONES_PUSH.md` (barbero) y
 * `docs/backend/PUSH_CLIENTE.md` (cliente).
 */

function rutaLlavePublica(zona: ZonaPush): string {
  return zona === 'cliente'
    ? '/cliente/push/llave-publica'
    : '/barbero/push/llave-publica'
}

function rutaSuscripcion(zona: ZonaPush): string {
  return zona === 'cliente'
    ? '/cliente/push/suscripcion'
    : '/barbero/push/suscripciones'
}

export async function obtenerLlavePublica(zona: ZonaPush): Promise<string> {
  if (zona === 'cliente') {
    const respuesta = await peticion<LlavePublicaCliente>(rutaLlavePublica(zona), {
      zona: 'cliente',
    })
    return respuesta.llavePublica
  }

  const respuesta = await peticion<LlavePublicaBarbero>(rutaLlavePublica(zona), {
    zona: 'barbero',
  })
  return respuesta.publicKey
}

/** Idempotente por `endpoint`: el backend reasigna la suscripción al dueño del token. */
export function suscribirPush(
  cuerpo: SuscripcionPush,
  zona: ZonaPush,
): Promise<RespuestaSuscripcion> {
  return peticion<RespuestaSuscripcion>(rutaSuscripcion(zona), {
    metodo: 'POST',
    cuerpo,
    zona,
  })
}

/** El endpoint identifica la suscripción; el `endpoint` va en el cuerpo. */
export async function cancelarPush(
  endpoint: string,
  zona: ZonaPush,
): Promise<void> {
  await peticion<void>(rutaSuscripcion(zona), {
    metodo: 'DELETE',
    cuerpo: { endpoint },
    zona,
  })
}
