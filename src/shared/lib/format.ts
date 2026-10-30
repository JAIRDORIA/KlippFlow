/**
 * Formatos de presentación de KlippFlow.
 * Reglas: https://.../docs/DISENO.md §4. Montos enteros en pesos colombianos.
 */

export interface OpcionesPesos {
  /** En listas el negativo usa el signo menos tipográfico y un espacio. */
  lista?: boolean
}

const formateadorMiles = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  useGrouping: true,
})

function aEntero(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null
  const numero = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(numero)) return null
  return Math.trunc(numero)
}

/** "$30.000", "-$7.000", "− $42.000" en listas, "$0". */
export function formatearPesos(
  valor: number | string | null | undefined,
  opciones: OpcionesPesos = {},
): string {
  const entero = aEntero(valor)
  if (entero === null || entero === 0) return '$0'

  const absoluto = formateadorMiles.format(Math.abs(entero))
  if (entero < 0) {
    return opciones.lista ? `− $${absoluto}` : `-$${absoluto}`
  }
  return `$${absoluto}`
}

/** "317 884 1100"; acepta +57 y separadores, pero muestra solo los 10 dígitos. */
export function formatearCelular(valor: string | number): string {
  const original = String(valor).trim()
  const digitos = original.replace(/\D/g, '')
  const nacional =
    digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos

  if (nacional.length !== 10) return original
  return `${nacional.slice(0, 3)} ${nacional.slice(3, 6)} ${nacional.slice(6)}`
}

export interface OpcionesDuracion {
  /**
   * "cuenta" (por defecto): "1 h 12 min" para cuenta regresiva.
   * "servicio": conserva minutos totales: "90 min".
   */
  estilo?: 'cuenta' | 'servicio'
}

/** "45 min", "1 h 12 min", "1 h"; en servicios "90 min". */
export function formatearDuracion(
  minutos: number,
  opciones: OpcionesDuracion = {},
): string {
  if (!Number.isFinite(minutos)) return '0 min'
  const total = Math.max(0, Math.trunc(minutos))

  if (total < 60 || opciones.estilo === 'servicio') return `${total} min`

  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}
