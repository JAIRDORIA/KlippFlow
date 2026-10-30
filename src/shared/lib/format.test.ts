import { describe, expect, it } from 'vitest'
import {
  formatearCelular,
  formatearDuracion,
  formatearPesos,
} from './format'

describe('formatearPesos', () => {
  it('formatea enteros con punto de miles y símbolo', () => {
    expect(formatearPesos(30000)).toBe('$30.000')
    expect(formatearPesos(999)).toBe('$999')
    expect(formatearPesos(1_000_000)).toBe('$1.000.000')
    expect(formatearPesos(30_000_000)).toBe('$30.000.000')
  })

  it('acepta montos como texto, como los puede devolver la API', () => {
    expect(formatearPesos('20000')).toBe('$20.000')
    expect(formatearPesos(' 1500 ')).toBe('$1.500')
  })

  it('maneja el cero', () => {
    expect(formatearPesos(0)).toBe('$0')
    expect(formatearPesos('0')).toBe('$0')
    expect(formatearPesos(-0)).toBe('$0')
  })

  it('formatea negativos grandes y de lista', () => {
    expect(formatearPesos(-7000)).toBe('-$7.000')
    expect(formatearPesos(-42_000, { lista: true })).toBe('− $42.000')
    expect(formatearPesos(-1_250_000)).toBe('-$1.250.000')
  })

  it('trunca decimales y tolera valores inválidos', () => {
    expect(formatearPesos(1234.99)).toBe('$1.234')
    expect(formatearPesos('no-es-un-monto')).toBe('$0')
    expect(formatearPesos(null)).toBe('$0')
    expect(formatearPesos(undefined)).toBe('$0')
  })
})

describe('formatearCelular', () => {
  it('agrupa los diez dígitos', () => {
    expect(formatearCelular('3178841100')).toBe('317 884 1100')
    expect(formatearCelular('3001234567')).toBe('300 123 4567')
  })

  it('acepta +57, espacios y guiones', () => {
    expect(formatearCelular('+57 317 884 1100')).toBe('317 884 1100')
    expect(formatearCelular('+57-300-123-4567')).toBe('300 123 4567')
  })

  it('devuelve el original si no hay diez dígitos', () => {
    expect(formatearCelular('123')).toBe('123')
    expect(formatearCelular('')).toBe('')
  })
})

describe('formatearDuracion', () => {
  it('muestra minutos cuando es menor a una hora', () => {
    expect(formatearDuracion(45)).toBe('45 min')
    expect(formatearDuracion(5)).toBe('5 min')
    expect(formatearDuracion(0)).toBe('0 min')
  })

  it('muestra horas y minutos para cuenta regresiva', () => {
    expect(formatearDuracion(72)).toBe('1 h 12 min')
    expect(formatearDuracion(119)).toBe('1 h 59 min')
    expect(formatearDuracion(60)).toBe('1 h')
    expect(formatearDuracion(125)).toBe('2 h 5 min')
  })

  it('conserva minutos totales en servicios', () => {
    expect(formatearDuracion(90, { estilo: 'servicio' })).toBe('90 min')
    expect(formatearDuracion(45, { estilo: 'servicio' })).toBe('45 min')
  })

  it('normaliza valores inválidos o negativos', () => {
    expect(formatearDuracion(Number.NaN)).toBe('0 min')
    expect(formatearDuracion(-30)).toBe('0 min')
  })
})
