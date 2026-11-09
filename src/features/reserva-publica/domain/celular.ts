const CARACTERES_PERMITIDOS = /^\+?[0-9\s-]+$/

/**
 * Normaliza al formato que acepta la API: 10 dígitos que empiezan por 3.
 * Acepta +57, espacios y guiones. Rechaza letras u otros caracteres.
 */
export function normalizarCelular(valor: string): string | null {
  const limpio = valor.trim()
  if (!limpio || !CARACTERES_PERMITIDOS.test(limpio)) return null

  const digitos = limpio.replace(/\D/g, '')
  const nacional =
    digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos

  return /^3\d{9}$/.test(nacional) ? nacional : null
}

export function celularValido(valor: string): boolean {
  return normalizarCelular(valor) !== null
}

/**
 * Presentación legible del celular del perfil: `3001112233` → `300 111 2233`.
 * Devuelve `null` si el valor no normaliza (así la casilla no se muestra).
 */
export function formatearCelularVisible(valor: string): string | null {
  const normalizado = normalizarCelular(valor)
  if (!normalizado) return null
  return `${normalizado.slice(0, 3)} ${normalizado.slice(3, 6)} ${normalizado.slice(6)}`
}
