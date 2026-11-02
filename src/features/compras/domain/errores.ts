import { ErrorPeticion } from '@/shared/api/client'

/**
 * Mapa de errores de Compras.
 *
 * Fuente: `docs/backend/COMPRAS_Y_BALANCE.md`.
 * - 409: la compra ya no es del día actual (editar o eliminar).
 * - 404: compra inexistente o de otro barbero.
 */

export interface ErrorCompra {
  mensaje: string
  /** El estado cambió en el servidor: conviene releer la lista. */
  refrescar: boolean
}

const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_429 = 'Demasiados intentos, espera un momento.'

export function mensajeDeErrorCompra(error: unknown): ErrorCompra {
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
    return { mensaje: texto || 'Compra no encontrada', refrescar: true }
  }

  if (status === 409) {
    return { mensaje: 'Esta compra ya no se puede modificar', refrescar: true }
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
