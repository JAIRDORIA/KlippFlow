import type { BarberoAdmin, EstadoCuenta } from '../types'
import { coincideBusqueda, nombreCompleto } from './texto'

/** Filtros de la lista: los cuatro chips del panel. */
export type FiltroEstado = 'todos' | EstadoCuenta

export interface ConteosEstado {
  todos: number
  activo: number
  suspendido: number
  vencido: number
}

export function contarPorEstado(
  barberos: readonly BarberoAdmin[],
): ConteosEstado {
  const conteos: ConteosEstado = {
    todos: barberos.length,
    activo: 0,
    suspendido: 0,
    vencido: 0,
  }

  for (const barbero of barberos) {
    if (barbero.estadoCuenta === 'activo') conteos.activo += 1
    else if (barbero.estadoCuenta === 'suspendido') conteos.suspendido += 1
    else if (barbero.estadoCuenta === 'vencido') conteos.vencido += 1
  }

  return conteos
}

/** Orden alfabético por nombre y apellidos (insensible a acentos y mayúsculas). */
export function ordenarPorNombre(barberos: readonly BarberoAdmin[]): BarberoAdmin[] {
  return [...barberos].sort((a, b) =>
    nombreCompleto(a).localeCompare(nombreCompleto(b), 'es', { sensitivity: 'base' }),
  )
}

export function filtrarBarberos(
  barberos: readonly BarberoAdmin[],
  filtros: { estado: FiltroEstado; busqueda: string },
): BarberoAdmin[] {
  return ordenarPorNombre(
    barberos.filter((barbero) => {
      if (filtros.estado !== 'todos' && barbero.estadoCuenta !== filtros.estado) {
        return false
      }
      return coincideBusqueda(barbero, filtros.busqueda)
    }),
  )
}
