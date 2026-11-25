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
  if (/correo/i.test(mensaje)) {
    return /inicia sesi[oó]n/i.test(mensaje)
      ? mensaje
      : 'Ese correo ya está registrado'
  }
  if (/usuario|uso/i.test(mensaje)) return 'Ese usuario ya está en uso'
  return null
}

export const MENSAJE_CORREO_SIN_VERIFICAR =
  'Debes verificar tu correo antes de iniciar sesión'

/**
 * 403 del login (contraseña o passkey) de un cliente que aún no confirmó su
 * correo. Se distingue del 403 de cuenta inactiva por el mensaje.
 */
export function esCorreoSinVerificar(error: unknown): boolean {
  return (
    error instanceof ErrorPeticion &&
    error.status === 403 &&
    /verificar tu correo/i.test(error.mensaje)
  )
}

export function mapearErrorLogin(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 401) return 'Usuario o contraseña incorrectos'
  if (esCorreoSinVerificar(error)) return MENSAJE_CORREO_SIN_VERIFICAR
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

/**
 * Errores de verificar correo y restablecer contraseña: el 400 trae el texto
 * del backend ("Código inválido o vencido", "El correo ya está verificado",
 * reglas de contraseña…).
 */
export function mapearErrorCodigo(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 400) return mensajeDeApi(error)
  if (error.status === 403) return error.mensaje || MENSAJE_GENERICO
  if (error.status === 429) {
    return 'Demasiados intentos. Espera unos minutos antes de reintentar.'
  }
  if (error.status === 0) return MENSAJE_RED

  return MENSAJE_GENERICO
}

/** Errores de reenviar código y pedir recuperación (respuesta genérica). */
export function mapearErrorSolicitudCodigo(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 429) {
    return 'Demasiados intentos. Espera unos minutos antes de pedir otro código.'
  }
  if (error.status === 0) return MENSAJE_RED
  if (error.status === 400) return mensajeDeApi(error)

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

/**
 * Errores de `POST /cliente/citas/:id/cambio-hora/{aceptar|rechazar}`.
 * Fuente: `docs/backend/CAMBIO_HORA.md`.
 */
export function mapearErrorCambioHora(error: unknown): string {
  if (!(error instanceof ErrorPeticion)) return MENSAJE_GENERICO

  if (error.status === 0) return MENSAJE_RED
  if (error.status === 404) return 'No encontramos esta cita.'
  if (error.status === 429) return 'Demasiados intentos, espera un momento'
  if (error.status === 400) return mensajeDeApi(error)

  if (error.status === 409) {
    const texto = (error.mensaje ?? '').trim()
    if (/expir/i.test(texto)) return 'La propuesta ya expiró.'
    if (/horario|disponible/i.test(texto)) {
      return 'Ese horario ya no está disponible. La propuesta se descartó.'
    }
    return 'Ya no hay una propuesta vigente para esta cita.'
  }

  return MENSAJE_GENERICO
}

export type CampoRegistro =
  | 'nombre'
  | 'username'
  | 'contrasena'
  | 'celular'
  | 'correo'

export type ErroresCamposRegistro = Partial<Record<CampoRegistro, string>>

export interface ErrorRegistroMapeado {
  /** Mensaje principal para el resumen del formulario. */
  mensaje: string
  /** Todos los mensajes del backend, para mostrarlos uno por línea. */
  detalle: string[]
  /** Mensajes asociados al campo que los originó. */
  campos: ErroresCamposRegistro
}

const PATRONES_CAMPO_REGISTRO: ReadonlyArray<{
  campo: CampoRegistro
  patron: RegExp
}> = [
  { campo: 'nombre', patron: /\bnombre\b/i },
  { campo: 'username', patron: /\busername\b|\busuario\b/i },
  {
    campo: 'contrasena',
    patron: /\bcontrasena\b|\bcontraseña\b|\bpassword\b/i,
  },
  { campo: 'celular', patron: /\bcelular\b|\btelefono\b|\bteléfono\b/i },
  { campo: 'correo', patron: /\bcorreo\b|\bemail\b|\bmail\b/i },
]

function campoDeMensajeRegistro(mensaje: string): CampoRegistro | null {
  const encontrado = PATRONES_CAMPO_REGISTRO.find(({ patron }) =>
    patron.test(mensaje),
  )
  return encontrado?.campo ?? null
}

/**
 * Traduce los errores documentados de POST /auth/cliente/registro.
 * En 400 conserva cada mensaje del backend (aunque llegue como array) y lo
 * asocia a su campo cuando el texto lo menciona.
 */
export function mapearErrorRegistro(error: unknown): ErrorRegistroMapeado {
  if (!(error instanceof ErrorPeticion)) {
    return { mensaje: MENSAJE_GENERICO, detalle: [], campos: {} }
  }

  if (error.status === 400) {
    const detalle =
      error.campos && error.campos.length > 0
        ? [...error.campos]
        : [error.mensaje || MENSAJE_GENERICO]
    const campos: ErroresCamposRegistro = {}

    for (const mensaje of detalle) {
      const campo = campoDeMensajeRegistro(mensaje)
      if (!campo) continue
      campos[campo] = campos[campo] ? `${campos[campo]} ${mensaje}` : mensaje
    }

    return {
      mensaje: detalle[0] ?? MENSAJE_GENERICO,
      detalle,
      campos,
    }
  }

  if (error.status === 409) {
    if (/correo/i.test(error.mensaje)) {
      const mensaje = 'Ese correo ya está registrado'
      return { mensaje, detalle: [mensaje], campos: { correo: mensaje } }
    }
    const mensaje = 'Ese usuario ya está en uso'
    return { mensaje, detalle: [mensaje], campos: { username: mensaje } }
  }

  if (error.status === 429) {
    const mensaje = 'Demasiados intentos. Espera unos minutos.'
    return { mensaje, detalle: [mensaje], campos: {} }
  }

  if (error.status === 0) {
    return { mensaje: MENSAJE_RED, detalle: [MENSAJE_RED], campos: {} }
  }

  const mensaje = error.mensaje || MENSAJE_GENERICO
  return { mensaje, detalle: [mensaje], campos: {} }
}
