import { describe, expect, it } from 'vitest'
import type { Servicio } from '../types'
import {
  DURACION_DEFECTO,
  DESCRIPCION_MAX,
  hayCambiosServicio,
  ordenarServicios,
  parsearDuracion,
  textoDuracion,
  textoPrecio,
  validarServicio,
} from './servicios'

function servicio(parcial: Partial<Servicio> & { id: number }): Servicio {
  return {
    nombre: 'Corte',
    descripcion: null,
    precio: 20000,
    duracionMinutos: 30,
    activo: true,
    ...parcial,
  }
}

describe('validarServicio', () => {
  it('acepta un servicio válido', () => {
    const resultado = validarServicio({
      nombre: '  Corte clásico  ',
      descripcion: '  Con tijera  ',
      precio: '20.000',
      duracion: '30',
    })

    expect(resultado.valido).toBe(true)
    expect(resultado.nombre).toBe('Corte clásico')
    expect(resultado.descripcion).toBe('Con tijera')
    expect(resultado.precio).toBe(20000)
    expect(resultado.duracion).toBe(30)
    expect(resultado.errores).toEqual({})
  })

  it('exige un nombre de 2 a 100 caracteres', () => {
    expect(validarServicio({ nombre: 'A', descripcion: '', precio: '1', duracion: '30' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'AB', descripcion: '', precio: '1', duracion: '30' }).valido).toBe(true)
    expect(
      validarServicio({ nombre: 'a'.repeat(100), descripcion: '', precio: '1', duracion: '30' }).valido,
    ).toBe(true)
    expect(
      validarServicio({ nombre: 'a'.repeat(101), descripcion: '', precio: '1', duracion: '30' }).errores
        .nombre,
    ).toContain('100')
  })

  it('acepta descripción vacía y rechaza más de 500', () => {
    expect(validarServicio({ nombre: 'Corte', descripcion: '   ', precio: '1', duracion: '30' }).descripcion).toBeNull()
    expect(
      validarServicio({
        nombre: 'Corte',
        descripcion: 'a'.repeat(DESCRIPCION_MAX),
        precio: '1',
        duracion: '30',
      }).valido,
    ).toBe(true)
    expect(
      validarServicio({
        nombre: 'Corte',
        descripcion: 'a'.repeat(DESCRIPCION_MAX + 1),
        precio: '1',
        duracion: '30',
      }).errores.descripcion,
    ).toContain('500')
  })

  it('valida el precio: mínimo 1, entero y sin letras', () => {
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '0', duracion: '30' }).errores.precio).toContain('mínimo')
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '-5', duracion: '30' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '12,5', duracion: '30' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: 'abc', duracion: '30' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '$25.000', duracion: '30' }).precio).toBe(25000)
  })

  it('valida la duración: 5–480 y múltiplos de 5', () => {
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '0' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '3' }).valido).toBe(false)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '5' }).valido).toBe(true)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '480' }).valido).toBe(true)
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '481' }).errores.duracion).toContain('480')
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '32' }).errores.duracion).toContain('5')
    expect(validarServicio({ nombre: 'Corte', descripcion: '', precio: '1', duracion: '30,5' }).valido).toBe(false)
  })

  it('publica la duración por defecto del diseño', () => {
    expect(DURACION_DEFECTO).toBe(30)
  })
})

describe('utilidades de presentación', () => {
  it('formatea duraciones', () => {
    expect(textoDuracion(45)).toBe('45 min')
    expect(textoDuracion(75)).toBe('1 h 15 min')
    expect(textoDuracion(60)).toBe('1 h')
  })

  it('formatea precios con y sin decimales de la API', () => {
    expect(textoPrecio(20000)).toBe('$20.000')
    expect(textoPrecio('25000')).toBe('$25.000')
    expect(textoPrecio(null)).toBe('$0')
  })

  it('parsea solo minutos enteros', () => {
    expect(parsearDuracion('45')).toBe(45)
    expect(parsearDuracion('45 min')).toBeNull()
    expect(parsearDuracion('4.5')).toBeNull()
  })
})

describe('ordenarServicios', () => {
  it('deja los inactivos al final conservando el orden por nombre', () => {
    const servicios = [
      servicio({ id: 1, nombre: 'Barba', activo: true }),
      servicio({ id: 2, nombre: 'Corte', activo: false }),
      servicio({ id: 3, nombre: 'Afeitado', activo: true }),
      servicio({ id: 4, nombre: 'Diseño', activo: false }),
    ]

    expect(ordenarServicios(servicios).map((item) => item.nombre)).toEqual([
      'Afeitado',
      'Barba',
      'Corte',
      'Diseño',
    ])
  })
})

describe('hayCambiosServicio', () => {
  const original = servicio({ id: 1, nombre: 'Corte', precio: 20000, duracionMinutos: 30 })

  it('detecta cambios en cada campo', () => {
    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte',
        descripcion: null,
        precio: 20000,
        duracion: 30,
      }),
    ).toBe(false)

    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte nuevo',
        descripcion: null,
        precio: 20000,
        duracion: 30,
      }),
    ).toBe(true)

    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte',
        descripcion: null,
        precio: 25000,
        duracion: 30,
      }),
    ).toBe(true)

    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte',
        descripcion: null,
        precio: 20000,
        duracion: 45,
      }),
    ).toBe(true)

    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte',
        descripcion: 'Con máquina',
        precio: 20000,
        duracion: 30,
      }),
    ).toBe(true)
  })

  it('trata descripción null y vacía como iguales', () => {
    expect(
      hayCambiosServicio(original, {
        nombre: 'Corte',
        descripcion: '',
        precio: 20000,
        duracion: 30,
      }),
    ).toBe(false)
  })
})
