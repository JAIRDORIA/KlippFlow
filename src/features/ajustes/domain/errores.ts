import { ErrorPeticion } from '@/shared/api/client'

/**
 * Mapa de errores de Ajustes.
 *
 * Fuentes: `docs/backend/SERVICIOS.md` y `HORARIOS_Y_CONFIGURACION.md`.
 * - 400: validación (el cliente HTTP ya deja el primer mensaje en `mensaje`).
 * - 404: `Servicio no encontrado` / `Horario no encontrado`.
 * - 409: solo en horarios, `El horario se cruza con otro bloque de ese día`.
 */

export type AccionAjustes = 'servicio' | 'horario'

export interface ErrorAjustes {
  mensaje: string
  /** El estado del servidor cambió (404/409): conviene releer. */
  refrescar: boolean
}

const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_429 = 'Demasiados intentos, espera un momento.'
const MENSAJE_CRUCE = 'El horario se cruza con otro bloque de ese día'

export function mensajeDeErrorAjustes(
  error: unknown,
  accion: AccionAjustes = 'servicio',
): ErrorAjustes {
  if (!(error instanceof ErrorPeticion)) {
    return { mensaje: MENSAJE_GENERICO, refrescar: false }
  }

  const { status } = error
  const texto = (error.mensaje ?? '').trim()

  if (status === 0) return { mensaje: MENSAJE_RED, refrescar: false }

  if (status === 401) {
    return { mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.', refrescar: false }
  }

  if (status === 403) {
    return { mensaje: texto || 'No tienes permiso para esta acción.', refrescar: false }
  }

  if (status === 404) {
    return {
      mensaje:
        texto || (accion === 'horario' ? 'Horario no encontrado' : 'Servicio no encontrado'),
      refrescar: true,
    }
  }

  if (status === 409) {
    return { mensaje: texto || MENSAJE_CRUCE, refrescar: true }
  }

  if (status === 400) {
    return {
      mensaje: texto || error.campos?.[0] || 'Revisa los datos e inténtalo de nuevo.',
      refrescar: false,
    }
  }

  if (status === 429) return { mensaje: MENSAJE_429, refrescar: false }

  return { mensaje: MENSAJE_GENERICO, refrescar: true }
}
