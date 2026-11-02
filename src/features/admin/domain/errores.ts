import { ErrorPeticion } from '@/shared/api/client'

/**
 * Mapa de errores del panel de administración.
 * Fuente de los códigos: `docs/backend/ADMIN.md` §271-280.
 */

const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_429 = 'Demasiados intentos, espera un momento.'

export interface ErrorAdmin {
  mensaje: string
  /** Sesión inválida: la UI deja de reintentar y manda al login. */
  sesionVencida: boolean
}

const CODIGO_UNICO = /c[oó]digo/i

export function mensajeDeErrorAdmin(error: unknown): ErrorAdmin {
  if (!(error instanceof ErrorPeticion)) {
    return { mensaje: MENSAJE_GENERICO, sesionVencida: false }
  }

  const texto = (error.mensaje ?? '').trim()

  if (error.status === 401) {
    return {
      mensaje:
        texto && texto !== 'Unauthorized'
          ? texto
          : 'Sesión de administrador vencida. Vuelve a entrar.',
      sesionVencida: true,
    }
  }

  if (error.status === 403) {
    return {
      mensaje: texto || 'No tienes permiso para esta acción.',
      sesionVencida: /token|sesión|sesion/i.test(texto),
    }
  }

  if (error.status === 400) {
    return {
      mensaje: texto || error.campos?.[0] || 'Revisa los datos e inténtalo de nuevo.',
      sesionVencida: false,
    }
  }

  if (error.status === 404) {
    return { mensaje: texto || 'Ese barbero ya no existe.', sesionVencida: false }
  }

  if (error.status === 409) {
    // El 409 también cubre "no se pudo generar código único".
    return {
      mensaje: CODIGO_UNICO.test(texto)
        ? texto
        : 'Ese usuario o correo ya existe.',
      sesionVencida: false,
    }
  }

  if (error.status === 429) return { mensaje: MENSAJE_429, sesionVencida: false }
  if (error.status === 0) return { mensaje: MENSAJE_RED, sesionVencida: false }

  return { mensaje: MENSAJE_GENERICO, sesionVencida: false }
}

/** Igual que el anterior, pero solo el texto (para toasts y mensajes inline). */
export function textoDeErrorAdmin(error: unknown): string {
  return mensajeDeErrorAdmin(error).mensaje
}

/**
 * Errores del login del admin (`ADMIN.md` §39-47): el 401 aquí es credenciales
 * incorrectas, no una sesión vencida.
 */
export function mensajeDeErrorLoginAdmin(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  const texto = (error.mensaje ?? '').trim()

  if (error.status === 401) return texto || 'Usuario o contraseña incorrectos'
  if (error.status === 403) {
    return texto || 'Tu cuenta de administrador no está activa.'
  }
  if (error.status === 400) return texto || 'Revisa los datos e inténtalo de nuevo.'
  if (error.status === 429) return MENSAJE_429
  if (error.status === 0) return MENSAJE_RED

  return MENSAJE_GENERICO
}

