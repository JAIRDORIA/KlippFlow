/**
 * Validación y formato de la propina.
 *
 * Fuente: `docs/backend/ATENCIONES_Y_PROPINAS.md`.
 * - Al marcar atendido: entero entre 1 y 1.000.000.
 * - Al corregir: el mismo rango, pero `0` quita la propina.
 */

import { parsearMontoEscrito } from '@/shared/lib/montos'

export { formatearMilesEntrada } from '@/shared/lib/montos'

export const PROPINA_MINIMA = 1
export const PROPINA_MAXIMA = 1_000_000

/** Atajos del sheet "Cliente atendido". */
export const ATAJOS_PROPINA = [2_000, 5_000, 10_000] as const

/** Dígitos que se conservan en el campo (1.000.000 usa 7). */
export const PROPINA_MAX_DIGITOS = 7

export interface OpcionesValidarPropina {
  /** En modo edición el 0 es válido: quita la propina. */
  permiteCero: boolean
}

export interface ResultadoPropina {
  valido: boolean
  monto: number | null
  error: string | null
}

// El formateo y la interpretación del texto viven en `shared/lib/montos` para
// que el formulario de compras use exactamente la misma regla.
export function parsearMiles(valor: string): number | null {
  return parsearMontoEscrito(valor)
}

/**
 * Acepta solo enteros escritos con dígitos y separadores de miles. Cualquier
 * texto, decimal, signo o valor fuera de rango devuelve un error legible.
 */
export function validarPropina(
  valor: string,
  opciones: OpcionesValidarPropina,
): ResultadoPropina {
  const limpio = valor.trim()

  if (!limpio) {
    return { valido: false, monto: null, error: 'Escribe el monto de la propina.' }
  }

  const monto = parsearMontoEscrito(limpio)
  if (monto === null) {
    return {
      valido: false,
      monto: null,
      error: 'La propina debe ser un número entero, sin decimales.',
    }
  }

  if (opciones.permiteCero && monto === 0) {
    return { valido: true, monto: 0, error: null }
  }

  if (monto < PROPINA_MINIMA) {
    return {
      valido: false,
      monto,
      error: 'La propina mínima es $1. Si no dejó propina, elige "No".',
    }
  }

  if (monto > PROPINA_MAXIMA) {
    return { valido: false, monto, error: 'La propina máxima es $1.000.000.' }
  }

  return { valido: true, monto, error: null }
}

export const MOTIVO_MAXIMO = 255

export interface ResultadoMotivo {
  valido: boolean
  motivo: string
  longitud: number
  error: string | null
}

/** Recorta espacios y valida el máximo de 255 caracteres del motivo. */
export function validarMotivoCancelacion(valor: string): ResultadoMotivo {
  const motivo = valor.trim()

  if (motivo.length > MOTIVO_MAXIMO) {
    return {
      valido: false,
      motivo,
      longitud: motivo.length,
      error: 'El motivo no puede pasar de 255 caracteres.',
    }
  }

  return { valido: true, motivo, longitud: motivo.length, error: null }
}
