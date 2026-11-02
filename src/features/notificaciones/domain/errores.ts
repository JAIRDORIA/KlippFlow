import { ErrorPeticion } from '@/shared/api/client'
import type { EstadoNotificaciones } from '../types'

/**
 * Mapa de errores de la activación de notificaciones.
 *
 * Fuentes: `docs/backend/NOTIFICACIONES_PUSH.md` (401/400/429) y los errores
 * del navegador al pedir permiso o suscribir (`NotAllowedError`, `AbortError`).
 */

export type MotivoErrorNotificaciones = 'sin-soporte' | 'permiso-denegado' | 'suscripcion'

const MENSAJES: Record<MotivoErrorNotificaciones, string> = {
  'sin-soporte': 'Este navegador no permite notificaciones.',
  'permiso-denegado':
    'Bloqueaste las notificaciones. Puedes volver a activarlas desde los ajustes del navegador.',
  suscripcion: 'No pudimos activar las notificaciones. Inténtalo de nuevo.',
}

export class ErrorNotificaciones extends Error {
  readonly motivo: MotivoErrorNotificaciones

  constructor(motivo: MotivoErrorNotificaciones, mensaje?: string) {
    super(mensaje ?? MENSAJES[motivo])
    this.name = 'ErrorNotificaciones'
    this.motivo = motivo
  }
}

export interface ResultadoErrorNotificaciones {
  mensaje: string
  estado: EstadoNotificaciones
}

const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_429 = 'Demasiados intentos, espera un momento.'

export function mensajeDeErrorNotificaciones(
  error: unknown,
): ResultadoErrorNotificaciones {
  if (error instanceof ErrorNotificaciones) {
    return {
      mensaje: error.message,
      estado:
        error.motivo === 'sin-soporte'
          ? 'no_soportado'
          : error.motivo === 'permiso-denegado'
            ? 'denegado'
            : 'error',
    }
  }

  if (error instanceof ErrorPeticion) {
    if (error.status === 401) {
      return { mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.', estado: 'error' }
    }
    if (error.status === 429) return { mensaje: MENSAJE_429, estado: 'error' }
    if (error.status === 400) {
      return {
        mensaje: error.mensaje || 'Revisa los datos e inténtalo de nuevo.',
        estado: 'error',
      }
    }
    if (error.status === 0) return { mensaje: MENSAJE_RED, estado: 'error' }
    return { mensaje: MENSAJE_GENERICO, estado: 'error' }
  }

  if (error instanceof Error) {
    if (error.name === 'NotAllowedError') {
      return {
        mensaje: MENSAJES['permiso-denegado'],
        estado: 'denegado',
      }
    }
    if (
      error.name === 'AbortError' ||
      error.name === 'InvalidStateError' ||
      error.name === 'NotSupportedError'
    ) {
      return { mensaje: MENSAJES.suscripcion, estado: 'error' }
    }
  }

  return { mensaje: MENSAJE_GENERICO, estado: 'error' }
}
