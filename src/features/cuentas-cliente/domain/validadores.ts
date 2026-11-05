import { normalizarCelular } from '@/features/reserva-publica/domain/celular'

export const USERNAMES_RESERVADOS = new Set([
  'admin',
  'root',
  'soporte',
  'klippflow',
  'barbero',
  'cliente',
  'api',
  'public',
])

export const LARGO_MINIMO_USERNAME = 4
export const LARGO_MAXIMO_USERNAME = 20
export const LARGO_MINIMO_CONTRASENA = 8
export const LARGO_MAXIMO_CONTRASENA = 72

export function normalizarUsername(valor: string): string {
  return valor.trim().toLowerCase()
}

/** Devuelve el primer error de username o null si es válido. */
export function validarUsername(valor: string): string | null {
  const username = normalizarUsername(valor)

  if (USERNAMES_RESERVADOS.has(username)) {
    return 'Ese usuario no está disponible.'
  }

  if (
    username.length < LARGO_MINIMO_USERNAME ||
    username.length > LARGO_MAXIMO_USERNAME
  ) {
    return `El usuario debe tener entre ${LARGO_MINIMO_USERNAME} y ${LARGO_MAXIMO_USERNAME} caracteres.`
  }

  if (!/^[a-z0-9._]+$/.test(username)) {
    return 'El usuario solo puede tener minúsculas, números, punto y guion bajo.'
  }

  if (/^[._]|[._]$/.test(username)) {
    return 'El usuario no puede empezar ni terminar en punto o guion bajo.'
  }

  if (username.includes('..')) {
    return 'El usuario no puede tener dos puntos seguidos.'
  }

  return null
}

/** Contraseña de 8 a 72 caracteres y distinta del username. */
export function validarContrasena(
  contrasena: string,
  username: string,
): string | null {
  if (
    contrasena.length < LARGO_MINIMO_CONTRASENA ||
    contrasena.length > LARGO_MAXIMO_CONTRASENA
  ) {
    return `La contraseña debe tener entre ${LARGO_MINIMO_CONTRASENA} y ${LARGO_MAXIMO_CONTRASENA} caracteres.`
  }

  if (contrasena === normalizarUsername(username)) {
    return 'La contraseña debe ser distinta del usuario.'
  }

  return null
}

/** Acepta +57 y espacios; normaliza a 10 dígitos que empiezan por 3. */
export function validarCelular(valor: string): string | null {
  if (!normalizarCelular(valor)) {
    return 'Escribe un celular de 10 dígitos que empiece por 3.'
  }
  return null
}

export interface ErroresPerfil {
  nombre?: string
  celular?: string
}

export function validarNombrePerfil(nombre: string): string | null {
  const limpio = nombre.trim()
  if (limpio.length < 2) return 'Escribe tu nombre.'
  if (limpio.length > 100) return 'El nombre no puede superar 100 caracteres.'
  return null
}

export function validarPerfilCliente(datos: {
  nombre: string
  celular: string
}): ErroresPerfil {
  const errores: ErroresPerfil = {}
  const nombre = validarNombrePerfil(datos.nombre)
  const celular = validarCelular(datos.celular)

  if (nombre) errores.nombre = nombre
  if (celular) errores.celular = celular

  return errores
}
