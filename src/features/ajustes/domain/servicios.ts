import { formatearDuracion, formatearPesos } from '@/shared/lib/format'
import { parsearMontoEscrito } from '@/shared/lib/montos'
import type { Servicio } from '../types'

/**
 * Validación del formulario de servicio.
 *
 * Fuente: `docs/backend/SERVICIOS.md`.
 * - `nombre`: obligatorio, 2–100 caracteres.
 * - `descripcion`: opcional, máximo 500.
 * - `precio`: entero, mínimo 1 (no hay máximo documentado).
 * - `duracionMinutos`: entero 5–480, divisible por 5.
 */

export const NOMBRE_MIN = 2
export const NOMBRE_MAX = 100
export const DESCRIPCION_MAX = 500
export const PRECIO_MIN = 1
export const DURACION_MIN = 5
export const DURACION_MAX = 480
export const DURACION_PASO = 5
export const DURACION_DEFECTO = 30

/** Dígitos que se conservan en el campo de precio (límite de entrada, no de API). */
export const PRECIO_MAX_DIGITOS = 9

export interface EntradaServicio {
  nombre: string
  descripcion: string
  precio: string
  duracion: string
}

export interface ErroresServicio {
  nombre?: string
  descripcion?: string
  precio?: string
  duracion?: string
}

export interface ResultadoServicio {
  valido: boolean
  nombre: string
  descripcion: string | null
  precio: number | null
  duracion: number | null
  errores: ErroresServicio
}

export function validarServicio(entrada: EntradaServicio): ResultadoServicio {
  const nombre = entrada.nombre.trim()
  const descripcion = entrada.descripcion.trim()
  const errores: ErroresServicio = {}

  if (nombre.length < NOMBRE_MIN) {
    errores.nombre = 'Escribe un nombre de al menos 2 caracteres.'
  } else if (nombre.length > NOMBRE_MAX) {
    errores.nombre = 'El nombre no puede pasar de 100 caracteres.'
  }

  if (descripcion.length > DESCRIPCION_MAX) {
    errores.descripcion = 'La descripción no puede pasar de 500 caracteres.'
  }

  const precio = parsearMontoEscrito(entrada.precio)
  if (!entrada.precio.trim()) {
    errores.precio = 'Escribe el precio del servicio.'
  } else if (precio === null) {
    errores.precio = 'El precio debe ser un número entero, sin decimales ni letras.'
  } else if (precio < PRECIO_MIN) {
    errores.precio = 'El precio mínimo es $1.'
  }

  const duracion = parsearDuracion(entrada.duracion)
  if (!entrada.duracion.trim()) {
    errores.duracion = 'Escribe la duración en minutos.'
  } else if (duracion === null) {
    errores.duracion = 'La duración debe ser un número entero de minutos.'
  } else if (duracion < DURACION_MIN || duracion > DURACION_MAX) {
    errores.duracion = 'La duración debe estar entre 5 y 480 minutos.'
  } else if (duracion % DURACION_PASO !== 0) {
    errores.duracion = 'La duración debe ir en pasos de 5 minutos.'
  }

  return {
    valido: Object.keys(errores).length === 0 && precio !== null && duracion !== null,
    nombre,
    descripcion: descripcion || null,
    precio,
    duracion,
    errores,
  }
}

/** Solo dígitos: "45" → 45; "4.5" o "45 min" → null. */
export function parsearDuracion(valor: string): number | null {
  const limpio = valor.trim()
  if (!/^\d+$/.test(limpio)) return null

  const numero = Number(limpio)
  return Number.isSafeInteger(numero) ? numero : null
}

/** "45 min", "1 h 15 min". */
export function textoDuracion(minutos: number): string {
  return formatearDuracion(Math.max(0, Math.trunc(minutos)))
}

/** "$20.000". */
export function textoPrecio(precio: number | string | null | undefined): string {
  return formatearPesos(precio)
}

/** Activos primero y, dentro de cada grupo, por nombre. */
export function ordenarServicios(servicios: readonly Servicio[]): Servicio[] {
  return [...servicios].sort((a, b) => {
    if (a.activo !== b.activo) return a.activo ? -1 : 1
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

export interface CambiosServicio {
  nombre: string
  descripcion: string | null
  precio: number
  duracion: number
}

/** ¿El formulario difiere del servicio original? */
export function hayCambiosServicio(
  original: Servicio,
  cambios: CambiosServicio,
): boolean {
  const descripcionOriginal = original.descripcion?.trim() ?? ''
  const descripcionNueva = cambios.descripcion?.trim() ?? ''
  const precioOriginal =
    typeof original.precio === 'number' ? original.precio : Number(original.precio)

  return (
    original.nombre.trim() !== cambios.nombre.trim() ||
    descripcionOriginal !== descripcionNueva ||
    Math.trunc(precioOriginal) !== cambios.precio ||
    original.duracionMinutos !== cambios.duracion
  )
}
