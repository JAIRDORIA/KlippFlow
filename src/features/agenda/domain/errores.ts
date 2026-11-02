import { ErrorPeticion } from '@/shared/api/client'

/**
 * Mapa de errores de las acciones del barbero a mensajes en español.
 *
 * Regla: si la API trae un mensaje claro, se reutiliza; los códigos con
 * mensaje poco útil (429) o ambiguo (409 de expiración) se traducen.
 * Fuente de los códigos: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md` y
 * `docs/backend/ATENCIONES_Y_PROPINAS.md`.
 */

export type AccionCita =
  | 'aceptar'
  | 'rechazar'
  | 'cancelar'
  | 'noAsistio'
  | 'atendido'
  | 'propina'

export interface ErrorAccion {
  mensaje: string
  /** El estado cambió en el servidor: conviene volver a leer. */
  refrescar: boolean
}

const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_429 = 'Demasiados intentos, espera un momento.'
const MENSAJE_409_PROPINA =
  'Solo puedes modificar la propina el mismo día de la atención'

export function mensajeDeError(accion: AccionCita, error: unknown): ErrorAccion {
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
    return {
      mensaje: texto || 'No tienes permiso para esta acción.',
      refrescar: false,
    }
  }

  if (status === 404) {
    return { mensaje: texto || 'No encontrado', refrescar: true }
  }

  if (status === 409) {
    const esSolicitud = accion === 'aceptar' || accion === 'rechazar'
    if (esSolicitud && /expir/i.test(texto)) {
      return { mensaje: 'Esta solicitud ya expiró', refrescar: true }
    }

    if (accion === 'propina') {
      return { mensaje: texto || MENSAJE_409_PROPINA, refrescar: true }
    }

    return { mensaje: texto || MENSAJE_GENERICO, refrescar: true }
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
