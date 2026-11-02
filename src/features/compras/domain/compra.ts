import { formatearPesos } from '@/shared/lib/format'
import { parsearMontoEscrito } from '@/shared/lib/montos'

/**
 * Validación del formulario de compra.
 *
 * Fuente: `docs/backend/COMPRAS_Y_BALANCE.md`.
 * - `descripcion`: 1 a 150 caracteres (la API recorta los espacios).
 * - `monto`: entero entre 1 y 50.000.000.
 */

export const DESCRIPCION_MAXIMA = 150
export const DESCRIPCION_AVISO = 20
export const MONTO_MINIMO = 1
export const MONTO_MAXIMO = 50_000_000
/** 50.000.000 usa 8 dígitos. */
export const COMPRA_MAX_DIGITOS = 8

export interface EntradaCompra {
  descripcion: string
  monto: string
}

export interface ErroresCompra {
  descripcion?: string
  monto?: string
}

export interface ResultadoCompra {
  valido: boolean
  /** Descripción recortada, lista para enviar. */
  descripcion: string
  monto: number | null
  errores: ErroresCompra
}

export function validarCompra(entrada: EntradaCompra): ResultadoCompra {
  const descripcion = entrada.descripcion.trim()
  const errores: ErroresCompra = {}

  if (!descripcion) {
    errores.descripcion = 'Escribe qué compraste.'
  } else if (descripcion.length > DESCRIPCION_MAXIMA) {
    errores.descripcion = 'La descripción no puede pasar de 150 caracteres.'
  }

  const monto = parsearMontoEscrito(entrada.monto)
  if (!entrada.monto.trim()) {
    errores.monto = 'Escribe el monto de la compra.'
  } else if (monto === null) {
    errores.monto = 'El monto debe ser un número entero, sin decimales ni letras.'
  } else if (monto < MONTO_MINIMO) {
    errores.monto = 'El monto mínimo es $1.'
  } else if (monto > MONTO_MAXIMO) {
    errores.monto = `El monto máximo es ${formatearPesos(MONTO_MAXIMO)}.`
  }

  return {
    valido: Object.keys(errores).length === 0 && monto !== null,
    descripcion,
    monto,
    errores,
  }
}

/** El contador de la descripción aparece solo cuando faltan menos de 20. */
export function mostrarContadorDescripcion(texto: string): boolean {
  return texto.length > DESCRIPCION_MAXIMA - DESCRIPCION_AVISO
}

/** Caracteres restantes; negativo cuando ya se pasó del máximo. */
export function caracteresRestantes(texto: string): number {
  return DESCRIPCION_MAXIMA - texto.length
}

/** ¿Cambió algo respecto de la compra original? */
export function hayCambios(
  original: { descripcion: string; monto: number },
  actual: { descripcion: string; monto: number },
): boolean {
  return (
    original.descripcion.trim() !== actual.descripcion.trim() ||
    original.monto !== actual.monto
  )
}
