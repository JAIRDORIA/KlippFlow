import { describe, expect, it } from 'vitest'
import type { BarberoAdmin, EstadoCuenta } from '../types'
import { contarPorEstado, filtrarBarberos, ordenarPorNombre } from './lista'

let siguienteId = 1

function barbero(
  nombres: string,
  apellidos: string,
  estadoCuenta: EstadoCuenta = 'activo',
  extra: Partial<BarberoAdmin> = {},
): BarberoAdmin {
  const id = siguienteId
  siguienteId += 1

  return {
    id,
    codigoUnico: `COD${id}`,
    nombres,
    apellidos,
    nombreBarberia: `${nombres} Barber`,
    username: `${nombres.toLowerCase()}.${apellidos.toLowerCase()}`,
    correo: `${nombres.toLowerCase()}@example.com`,
    estadoCuenta,
    linkReservas: `https://app.test/b/COD${id}`,
    ...extra,
  }
}

const LISTA = [
  barbero('Zoe', 'Ruiz', 'suspendido'),
  barbero('Ana', 'Paz', 'activo'),
  barbero('Núñez', 'Muñoz', 'vencido'),
  barbero('Beatriz', 'Gómez', 'activo'),
]

describe('contarPorEstado', () => {
  it('cuenta todos y cada estado', () => {
    expect(contarPorEstado(LISTA)).toEqual({
      todos: 4,
      activo: 2,
      suspendido: 1,
      vencido: 1,
    })
  })

  it('con lista vacía todo queda en cero', () => {
    expect(contarPorEstado([])).toEqual({
      todos: 0,
      activo: 0,
      suspendido: 0,
      vencido: 0,
    })
  })
})

describe('ordenarPorNombre', () => {
  it('ordena por nombre ignorando mayúsculas y acentos', () => {
    expect(ordenarPorNombre(LISTA).map((item) => item.nombres)).toEqual([
      'Ana',
      'Beatriz',
      'Núñez',
      'Zoe',
    ])
  })

  it('no muta la lista original', () => {
    const copia = [...LISTA]
    ordenarPorNombre(LISTA)
    expect(LISTA).toEqual(copia)
  })
})

describe('filtrarBarberos', () => {
  it('sin filtros devuelve todo ordenado por nombre', () => {
    const resultado = filtrarBarberos(LISTA, { estado: 'todos', busqueda: '' })
    expect(resultado).toHaveLength(4)
    expect(resultado[0]?.nombres).toBe('Ana')
  })

  it('filtra por estado', () => {
    expect(
      filtrarBarberos(LISTA, { estado: 'activo', busqueda: '' }).map((item) => item.nombres),
    ).toEqual(['Ana', 'Beatriz'])

    expect(
      filtrarBarberos(LISTA, { estado: 'vencido', busqueda: '' }).map((item) => item.nombres),
    ).toEqual(['Núñez'])
  })

  it('combina estado y búsqueda', () => {
    expect(
      filtrarBarberos(LISTA, { estado: 'activo', busqueda: 'bea' }).map((item) => item.nombres),
    ).toEqual(['Beatriz'])

    expect(filtrarBarberos(LISTA, { estado: 'suspendido', busqueda: 'ana' })).toEqual([])
  })

  it('busca sin acentos', () => {
    expect(
      filtrarBarberos(LISTA, { estado: 'todos', busqueda: 'nunez' }).map((item) => item.nombres),
    ).toEqual(['Núñez'])
  })

  it('con lista vacía devuelve vacío', () => {
    expect(filtrarBarberos([], { estado: 'todos', busqueda: 'ana' })).toEqual([])
  })

  it('devuelve vacío si nada coincide', () => {
    expect(filtrarBarberos(LISTA, { estado: 'todos', busqueda: 'zzz' })).toEqual([])
  })
})
