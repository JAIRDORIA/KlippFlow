import { ErrorPeticion } from '@/shared/api/client'

export interface ErrorCreacionMapeado {
  mensaje: string
  recargarHorarios: boolean
  descartarHora: boolean
}

const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'

export function esError404(error: unknown): boolean {
  return error instanceof ErrorPeticion && error.status === 404
}

function mensajeDeApi(error: ErrorPeticion): string {
  if (error.campos && error.campos.length > 0) return error.campos.join(' · ')
  return error.mensaje
}

/** Traduce los errores documentados del POST a mensajes de la UI. */
export function mapearErrorCreacion(error: unknown): ErrorCreacionMapeado {
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
    if (/horario ya no está disponible|ya no está disponible/i.test(error.mensaje)) {
      return {
        mensaje: 'Ese horario ya no está disponible. Elige otro.',
        recargarHorarios: true,
        descartarHora: true,
      }
    }

    if (/solicitud pendiente|pendiente de respuesta/i.test(error.mensaje)) {
      return {
        mensaje:
          'Ya tienes una solicitud pendiente con este celular. Espera la respuesta del barbero.',
        recargarHorarios: false,
        descartarHora: false,
      }
    }

    if (/barbero|no activo|reservas no/i.test(error.mensaje)) {
      return {
        mensaje: 'Las reservas no están disponibles por ahora.',
        recargarHorarios: false,
        descartarHora: false,
      }
    }

    return {
      mensaje: error.mensaje || 'No se pudo crear la cita. Inténtalo de nuevo.',
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  if (error.status === 429) {
    return {
      mensaje: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
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

  if (error.status >= 500) {
    return {
      mensaje: MENSAJE_GENERICO,
      recargarHorarios: false,
      descartarHora: false,
    }
  }

  return {
    mensaje: error.mensaje || MENSAJE_GENERICO,
    recargarHorarios: false,
    descartarHora: false,
  }
}
