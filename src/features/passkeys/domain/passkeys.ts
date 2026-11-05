import { ErrorPeticion } from '@/shared/api/client'

export type ContextoPasskey = 'registro' | 'login'

export interface ErrorPasskeyMapeado {
  mensaje: string
  silencioso: boolean
}

export interface EntornoPasskeys {
  userAgent?: string
  tienePublicKeyCredential?: boolean
  tieneCredenciales?: boolean
  contextoSeguro?: boolean
}

const MENSAJE_GENERICO = 'No pudimos completar la operación. Inténtalo de nuevo.'
const MENSAJE_CANCELADO = 'No se completó. Puedes intentarlo de nuevo.'

/** Entorno real del navegador; único punto que toca `window`/`navigator`. */
export function leerEntornoPasskeys(): EntornoPasskeys {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { userAgent: '', contextoSeguro: false }
  }

  const credenciales = navigator.credentials
  return {
    userAgent: navigator.userAgent,
    tienePublicKeyCredential: typeof window.PublicKeyCredential !== 'undefined',
    tieneCredenciales:
      typeof credenciales?.create === 'function' &&
      typeof credenciales?.get === 'function',
    contextoSeguro: window.isSecureContext !== false,
  }
}

/** WebAuthn utilizable: API presente y contexto seguro. */
export function soportaPasskeys(
  entorno: EntornoPasskeys = leerEntornoPasskeys(),
): boolean {
  return (
    entorno.contextoSeguro !== false &&
    entorno.tienePublicKeyCredential === true &&
    entorno.tieneCredenciales === true
  )
}

/**
 * Comprobación asíncrona para decidir si OFRECER crear una passkey.
 * No se usa para mostrar el botón de login.
 */
export async function autenticadorPlataformaDisponible(): Promise<boolean> {
  if (!soportaPasskeys()) return false

  try {
    const constructor = window.PublicKeyCredential
    if (
      typeof constructor?.isUserVerifyingPlatformAuthenticatorAvailable !==
      'function'
    ) {
      return false
    }
    return await constructor.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function nombreDeError(error: unknown): string | null {
  if (error instanceof Error) return error.name
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const nombre = (error as { name?: unknown }).name
    return typeof nombre === 'string' ? nombre : null
  }
  return null
}

function mensajeDeApi(error: ErrorPeticion): string {
  if (error.campos && error.campos.length > 0) return error.campos.join(' · ')
  return error.mensaje || MENSAJE_GENERICO
}

/** Traduce errores WebAuthn y del backend; indica si conviene no mostrarlos. */
export function mapearErrorPasskey(
  error: unknown,
  contexto: ContextoPasskey = 'registro',
): ErrorPasskeyMapeado {
  if (error instanceof ErrorPeticion) {
    if (error.status === 401) {
      return {
        mensaje:
          contexto === 'login'
            ? 'No se pudo iniciar sesión con la passkey. Usa tu usuario y contraseña.'
            : 'Tu sesión expiró. Vuelve a iniciar sesión.',
        silencioso: false,
      }
    }
    if (error.status === 409) {
      return {
        mensaje: 'Ya tienes 5 passkeys. Borra una para agregar otra.',
        silencioso: false,
      }
    }
    if (error.status === 429) {
      return {
        mensaje: 'Demasiados intentos, espera un momento.',
        silencioso: false,
      }
    }
    if (error.status === 503) {
      return { mensaje: 'Passkeys no disponibles por ahora.', silencioso: false }
    }
    if (error.status === 0) {
      return {
        mensaje: 'No pudimos conectar. Revisa tu internet.',
        silencioso: false,
      }
    }
    if (error.status === 400) {
      return { mensaje: mensajeDeApi(error), silencioso: false }
    }

    return { mensaje: MENSAJE_GENERICO, silencioso: false }
  }

  const nombre = nombreDeError(error)
  if (nombre === 'NotAllowedError' || nombre === 'AbortError') {
    return { mensaje: MENSAJE_CANCELADO, silencioso: true }
  }
  if (nombre === 'InvalidStateError' && contexto === 'registro') {
    return {
      mensaje: 'Este dispositivo ya tiene una passkey para tu cuenta.',
      silencioso: false,
    }
  }

  return { mensaje: MENSAJE_GENERICO, silencioso: false }
}

export function nombreSugeridoDispositivo(
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): string {
  if (/iPhone|iPod/i.test(userAgent)) return 'iPhone'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'Mac'
  return 'Mi dispositivo'
}

export function tipoDispositivoLegible(tipo: string): string {
  if (tipo === 'singleDevice') return 'Este dispositivo'
  if (tipo === 'multiDevice') return 'Sincronizada entre dispositivos'
  return tipo || 'Dispositivo'
}

/** Fecha y hora en Bogotá para “Creada el …” y “Último uso …”. */
export function fechaHoraPasskey(valor: string | null | undefined): string {
  if (!valor) return '—'

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return '—'

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(fecha)
}
