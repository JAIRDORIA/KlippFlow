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

/** `GET /barbero/push/llave-publica` */
export interface LlavePublica {
  publicKey: string
}

/** Body de `POST /barbero/push/suscripciones`. */
export interface SuscripcionPush {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/** Respuesta de `POST /barbero/push/suscripciones`. */
export interface RespuestaSuscripcion {
  creada: boolean
}
