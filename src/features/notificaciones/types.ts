/** Tipos de notificaciones. Fuente: `docs/backend/NOTIFICACIONES_PUSH.md`. */

export type PermisoNotificaciones = 'default' | 'granted' | 'denied'

export type EstadoNotificaciones =
  | 'no_soportado'
  | 'requiere_instalacion'
  | 'permiso_pendiente'
  | 'denegado'
  | 'activando'
  | 'activo'
  | 'error'

/** Un endpoint es único por rol: barbero y cliente usan rutas distintas. */
export type ZonaPush = 'barbero' | 'cliente'

/** `GET /barbero/push/llave-publica` */
export interface LlavePublicaBarbero {
  publicKey: string
}

/** Alias histórico del tipo de llave del barbero. */
export type LlavePublica = LlavePublicaBarbero

/** `GET /cliente/push/llave-publica` */
export interface LlavePublicaCliente {
  llavePublica: string
}

/** Body de `POST /barbero/push/suscripciones` y `/cliente/push/suscripcion`. */
export interface SuscripcionPush {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/** Respuesta de `POST` de suscripción (misma forma en ambos roles). */
export interface RespuestaSuscripcion {
  creada: boolean
}
