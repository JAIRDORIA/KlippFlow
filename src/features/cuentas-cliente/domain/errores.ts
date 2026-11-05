import { ErrorPeticion } from '@/shared/api/client'

const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'
const MENSAJE_GOOGLE_NO_DISPONIBLE = 'Inicio con Google no disponible'
const MENSAJE_REINICIAR_GOOGLE = 'Vuelve a continuar con Google'

function mensajeDeApi(error: ErrorPeticion): string {
  if (error.campos && error.campos.length > 0) return error.campos.join(' · ')
  return error.mensaje
}

function mensajeConflicto(mensaje: string): string | null {
  if (/google/i.test(mensaje)) return 'Ya existe una cuenta para este Google'
  if (/usuario|uso/i.test(mensaje)) return 'Ese usuario ya está en uso'
  return null
}

export function mapearErrorLogin(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 401) return 'Usuario o contraseña incorrectos'
  if (error.status === 403) {
    return 'Tu cuenta no está activa. Habla con el administrador de KlippFlow.'
  }
  if (error.status === 429) return 'Demasiados intentos, espera un momento'
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 409) {
    return mensajeConflicto(error.mensaje) ?? MENSAJE_GENERICO
  }

  return MENSAJE_GENERICO
}

export function mapearErrorGoogle(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 503) return MENSAJE_GOOGLE_NO_DISPONIBLE
  if (error.status === 429) return 'Demasiados intentos, espera un momento'
  if (error.status === 401) return error.mensaje || MENSAJE_GOOGLE_NO_DISPONIBLE
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 409) {
    return mensajeConflicto(error.mensaje) ?? MENSAJE_GENERICO
  }

  return MENSAJE_GENERICO
}

export function mapearErrorCompletarCuenta(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 401) return MENSAJE_REINICIAR_GOOGLE
  if (error.status === 429) return 'Demasiados intentos, espera un momento'
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)

  if (error.status === 409) {
    return mensajeConflicto(error.mensaje) ?? MENSAJE_GENERICO
  }

  return MENSAJE_GENERICO
}

export function mapearErrorContrasena(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 429) return 'Demasiados intentos, espera un momento'
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 401) return error.mensaje || MENSAJE_GENERICO

  return MENSAJE_GENERICO
}

export function mapearErrorPerfil(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 429) return 'Demasiados intentos, espera un momento'

  return MENSAJE_GENERICO
}

export function mapearErrorAgregarBarbero(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 404) return 'No encontramos ese código'
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 429) return 'Demasiados intentos, espera un momento'

  return MENSAJE_GENERICO
}

export interface ErrorCreacionClienteMapeado {
  mensaje: string
  recargarHorarios: boolean
  descartarHora: boolean
}

/** Errores documentados de POST /cliente/barberos/:codigo/citas. */
export function mapearErrorCreacionCliente(
  error: unknown,
): ErrorCreacionClienteMapeado {
  if (!(error instanceof ErrorPeticion)) {
    return {
      mensaje: MENSAJE_GENERICO,
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  if (error.status === 404) {
    return {
      mensaje: 'No encontramos esta barbería.',
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  if (error.status === 409) {
    if (/solicitud pendiente|pendiente de respuesta|pendiente vigente/i.test(error.mensaje)) {
      return {
        mensaje:
          'Ya tienes una solicitud pendiente. Espera la respuesta del barbero.',
        recargarHorarios: false,
        descartarHora: false,
      }
    }

    if (/horario ya no está disponible|ya no está disponible/i.test(error.mensaje)) {
      return {
        mensaje: 'Ese horario ya no está disponible. Elige otro.',
        recargarHorarios: true,
        descartarHora: true,
      }
    }

    if (/barbero|no activo|reservas no/i.test(error.mensaje)) {
      return {
        mensaje: 'Las reservas no están disponibles por ahora.',
        recargarHorarios: false,
        descartarHora: false,
      }
    }
  }

  if (error.status === 429) {
    return {
      mensaje: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  if (error.status === 0) {
    return {
      mensaje: MENSAJE_RED,
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  if (error.status === 400) {
    return {
      mensaje: mensajeDeApi(error),
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  return {
    mensaje: MENSAJE_GENERICO,
    recargarHorarios: false,
    descartarHora: false,
  }
}
