/**
 * Montos escritos por el usuario (propina y compras).
 *
 * Regla única: son enteros en pesos. Se aceptan con o sin símbolo `$`, con o
 * sin puntos de miles. Se rechazan decimales, negativos y letras.
 *
 * Fuente de los límites de cada pantalla:
 * - `docs/backend/ATENCIONES_Y_PROPINAS.md` (propina 1–1.000.000, 0 para quitar).
 * - `docs/backend/COMPRAS_Y_BALANCE.md` (compra 1–50.000.000).
 */

/** Máximo de dígitos que se conservan al escribir un monto. */
export const MAX_DIGITOS_MONTO = 9

const formateadorMiles = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  useGrouping: true,
})

/**
 * Deja solo dígitos y los agrupa por miles: "27000" → "27.000".
 * Es idempotente: "27.000" → "27.000".
 */
export function formatearMilesEntrada(
  valor: string,
  maxDigitos: number = MAX_DIGITOS_MONTO,
): string {
  const digitos = valor.replace(/\D/g, '').slice(0, Math.max(1, maxDigitos))
  if (!digitos) return ''

  const numero = Number(digitos)
  if (!Number.isSafeInteger(numero)) return ''

  return formateadorMiles.format(numero)
}

/** Quita el símbolo `$` y los espacios, que sí se aceptan al pegar. */
export function limpiarMontoEscrito(valor: string): string {
  return valor.replace(/\$/g, '').replace(/\s/g, '')
}

/** Acepta "5000" o el formato con puntos de miles "5.000". */
function esEnteroConMiles(limpio: string): boolean {
  return /^\d+$/.test(limpio) || /^\d{1,3}(\.\d{3})+$/.test(limpio)
}

/**
 * Interpreta lo escrito por el usuario: `"27.000"`, `"$27.000"` y `"27000"`
 * devuelven 27000. Decimales (`"27,5"`, `"12.5"`), negativos y letras → null.
 */
export function parsearMontoEscrito(valor: string): number | null {
  const limpio = limpiarMontoEscrito(valor.trim())
  if (!limpio || !esEnteroConMiles(limpio)) return null

  const numero = Number(limpio.replace(/\./g, ''))
  return Number.isSafeInteger(numero) ? numero : null
}
