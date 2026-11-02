import type { CrearBarberoBody } from '../types'
import { normalizarUsuario } from './texto'

/**
 * Validación del formulario "Nuevo barbero" con los límites exactos de
 * `docs/backend/ADMIN.md` §114-142:
 * `username` 3–50 (minúsculas, números, `.`, `-`, `_`), `password` 8–72,
 * `nombres`/`apellidos` 1–100, `nombreBarberia` opcional ≤150 y `correo`
 * obligatorio (NOT NULL) ≤150.
 */

export const USUARIO_MIN = 3
export const USUARIO_MAX = 50
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72
export const NOMBRES_MAX = 100
export const APELLIDOS_MAX = 100
export const BARBERIA_MAX = 150
export const CORREO_MAX = 150

const PATRON_USUARIO = /^[a-z0-9._-]+$/
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface EntradaBarbero {
  nombres: string
  apellidos: string
  nombreBarberia: string
  username: string
  correo: string
  password: string
}

export interface ErroresBarbero {
  nombres?: string
  apellidos?: string
  nombreBarberia?: string
  username?: string
  correo?: string
  password?: string
}

export interface ResultadoBarbero {
  valido: boolean
  /** Cuerpo exacto para `POST /admin/barberos`, o null si hay errores. */
  cuerpo: CrearBarberoBody | null
  errores: ErroresBarbero
}

/** Reglas de contraseña del backend (8–72), compartidas con "Restablecer". */
export function validarPassword(password: string): string | null {
  if (!password) return 'Escribe o genera una contraseña.'
  if (password.length < PASSWORD_MIN) {
    return `La contraseña necesita al menos ${PASSWORD_MIN} caracteres.`
  }
  if (password.length > PASSWORD_MAX) {
    return `La contraseña no puede pasar de ${PASSWORD_MAX} caracteres.`
  }
  return null
}

export function validarFormularioBarbero(entrada: EntradaBarbero): ResultadoBarbero {
  const errores: ErroresBarbero = {}

  const nombres = entrada.nombres.trim()
  if (!nombres) {
    errores.nombres = 'Escribe el nombre del barbero.'
  } else if (nombres.length > NOMBRES_MAX) {
    errores.nombres = `El nombre no puede pasar de ${NOMBRES_MAX} caracteres.`
  }

  const apellidos = entrada.apellidos.trim()
  if (!apellidos) {
    errores.apellidos = 'Escribe los apellidos del barbero.'
  } else if (apellidos.length > APELLIDOS_MAX) {
    errores.apellidos = `Los apellidos no pueden pasar de ${APELLIDOS_MAX} caracteres.`
  }

  const nombreBarberia = entrada.nombreBarberia.trim()
  if (nombreBarberia.length > BARBERIA_MAX) {
    errores.nombreBarberia = `El nombre de la barbería no puede pasar de ${BARBERIA_MAX} caracteres.`
  }

  const username = normalizarUsuario(entrada.username)
  if (!username) {
    errores.username = 'Escribe un usuario.'
  } else if (username.length < USUARIO_MIN) {
    errores.username = `El usuario necesita al menos ${USUARIO_MIN} caracteres.`
  } else if (username.length > USUARIO_MAX) {
    errores.username = `El usuario no puede pasar de ${USUARIO_MAX} caracteres.`
  } else if (!PATRON_USUARIO.test(username)) {
    errores.username =
      'El usuario solo admite minúsculas, números, punto, guion y guion bajo.'
  }

  const correo = entrada.correo.trim().toLowerCase()
  if (!correo) {
    errores.correo = 'Escribe el correo del barbero.'
  } else if (correo.length > CORREO_MAX) {
    errores.correo = `El correo no puede pasar de ${CORREO_MAX} caracteres.`
  } else if (!PATRON_CORREO.test(correo)) {
    errores.correo = 'Escribe un correo válido.'
  }

  const password = entrada.password
  const errorPassword = validarPassword(password)
  if (errorPassword) errores.password = errorPassword

  const valido = Object.keys(errores).length === 0

  return {
    valido,
    cuerpo: valido
      ? {
          username,
          password,
          nombres,
          apellidos,
          correo,
          ...(nombreBarberia ? { nombreBarberia } : {}),
        }
      : null,
    errores,
  }
}
