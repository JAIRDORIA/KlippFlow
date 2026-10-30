import { describe, expect, it } from 'vitest'
import type { ServicioPublico } from '../types'
import { calcularTotales, esDuracionValida } from './calculo'

const SERVICIOS: ServicioPublico[] = [
  {
    id: 1,
    nombre: 'TEST-Corte',
    descripcion: null,
    precio: 30000,
    duracionMinutos: 45,
  },
  {
    id: 2,
    nombre: 'TEST-Barba',
    descripcion: 'Con toalla',
    precio: '18000',
    duracionMinutos: 30,
  },
  {
    id: 3,
    nombre: 'TEST-Cejas',
    descripcion: null,
    precio: 10000,
    duracionMinutos: 15,
  },
]

describe('calcularTotales', () => {
  it('devuelve cero sin servicios', () => {
    expect(calcularTotales({ titular: [], acompanantes: [] }, SERVICIOS)).toEqual({
      duracionMinutos: 0,
      montoTotal: 0,
      cantidadServicios: 0,
    })
  })

  it('suma titular y varios acompañantes', () => {
    expect(
      calcularTotales(
        {
          titular: [1, 2],
          acompanantes: [[3], [1, 3]],
        },
        SERVICIOS,
      ),
    ).toEqual({
      duracionMinutos: 45 + 30 + 15 + 45 + 15,
      montoTotal: 30000 + 18000 + 10000 + 30000 + 10000,
      cantidadServicios: 5,
    })
  })

  it('convierte precios en texto y no duplica ids repetidos', () => {
    expect(
      calcularTotales({ titular: [2, 2, 2], acompanantes: [] }, SERVICIOS),
    ).toEqual({
      duracionMinutos: 30,
      montoTotal: 18000,
      cantidadServicios: 1,
    })
  })

  it('ignora servicios desconocidos', () => {
    expect(
      calcularTotales({ titular: [1, 999], acompanantes: [[999]] }, SERVICIOS),
    ).toEqual({
      duracionMinutos: 45,
      montoTotal: 30000,
      cantidadServicios: 1,
    })
  })

  it('acepta una duración total de 5 minutos', () => {
    const cinco: ServicioPublico = {
      id: 5,
      nombre: 'TEST-Cinco',
      descripcion: null,
      precio: 5000,
      duracionMinutos: 5,
    }
    expect(
      calcularTotales({ titular: [5], acompanantes: [] }, [cinco]).duracionMinutos,
    ).toBe(5)
  })

  it('acumula 600 minutos entre varias personas', () => {
    const servicios: ServicioPublico[] = [
      {
        id: 10,
        nombre: 'TEST-Largo',
        descripcion: null,
        precio: 100000,
        duracionMinutos: 480,
      },
      {
        id: 11,
        nombre: 'TEST-Medio',
        descripcion: null,
        precio: 30000,
        duracionMinutos: 120,
      },
    ]
    expect(
      calcularTotales({ titular: [10, 11], acompanantes: [] }, servicios)
        .duracionMinutos,
    ).toBe(600)
  })
})

describe('esDuracionValida', () => {
  it('acepta los bordes 5 y 600', () => {
    expect(esDuracionValida(5)).toBe(true)
    expect(esDuracionValida(600)).toBe(true)
  })

  it('rechaza valores fuera de rango o no divisibles por 5', () => {
    expect(esDuracionValida(0)).toBe(false)
    expect(esDuracionValida(4)).toBe(false)
    expect(esDuracionValida(601)).toBe(false)
    expect(esDuracionValida(33)).toBe(false)
    expect(esDuracionValida(5.5)).toBe(false)
  })
})
