import type { BarberoAdmin } from '../types'

/**
 * Normalización de texto para buscar y comparar.
 *
 * - Minúsculas, sin acentos ni diéresis (`Núñez` → `nunez`, `José` → `jose`).
 * - Espacios repetidos colapsados y extremos recortados.
 */

export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** El backend exige minúsculas en `username`; se recorta y se baja. */
export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase()
}

export function nombreCompleto(barbero: {
  nombres: string
  apellidos: string
}): string {
  return `${barbero.nombres} ${barbero.apellidos}`.trim()
}

const CAMPOS_BUSCABLES: Array<(barbero: BarberoAdmin) => string> = [
  (barbero) => barbero.nombres,
  (barbero) => barbero.apellidos,
  (barbero) => barbero.nombreBarberia ?? '',
  (barbero) => barbero.username,
]

/** Busca en nombres, apellidos, barbería y usuario; sin acentos ni mayúsculas. */
export function coincideBusqueda(barbero: BarberoAdmin, consulta: string): boolean {
  const buscado = normalizarBusqueda(consulta)
  if (!buscado) return true

  return CAMPOS_BUSCABLES.some((campo) =>
    normalizarBusqueda(campo(barbero)).includes(buscado),
  )
}
