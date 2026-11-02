import { describe, expect, it } from 'vitest'
import {
  ATAJOS_PROPINA,
  MOTIVO_MAXIMO,
  formatearMilesEntrada,
  parsearMiles,
  validarMotivoCancelacion,
  validarPropina,
} from './propina'

describe('validarPropina', () => {
  it('rechaza el 0 al registrar la atención', () => {
    const resultado = validarPropina('0', { permiteCero: false })
    expect(resultado.valido).toBe(false)
    expect(resultado.monto).toBe(0)
  })

  it('acepta el 0 al corregir: quita la propina', () => {
    expect(validarPropina('0', { permiteCero: true })).toEqual({
      valido: true,
      monto: 0,
      error: null,
    })
  })

  it('acepta los límites 1 y 1.000.000', () => {
    expect(validarPropina('1', { permiteCero: false })).toEqual({
      valido: true,
      monto: 1,
      error: null,
    })
    expect(validarPropina('1.000.000', { permiteCero: false })).toEqual({
      valido: true,
      monto: 1_000_000,
      error: null,
    })
  })

  it('rechaza 1.000.001', () => {
    const resultado = validarPropina('1.000.001', { permiteCero: false })
    expect(resultado.valido).toBe(false)
    expect(resultado.error).toContain('máxima')
  })

  it('acepta puntos de miles mientras se escribe', () => {
    expect(validarPropina('5.000', { permiteCero: false }).monto).toBe(5000)
  })

  it('rechaza decimales y texto', () => {
    expect(validarPropina('12,5', { permiteCero: false }).valido).toBe(false)
    expect(validarPropina('12.5', { permiteCero: false }).valido).toBe(false)
    expect(validarPropina('abc', { permiteCero: false }).valido).toBe(false)
    expect(validarPropina('-500', { permiteCero: false }).valido).toBe(false)
  })

  it('rechaza vacío', () => {
    expect(validarPropina('   ', { permiteCero: false }).valido).toBe(false)
  })
})

describe('formateo de la entrada de propina', () => {
  it('agrupa miles', () => {
    expect(formatearMilesEntrada('5000')).toBe('5.000')
    expect(formatearMilesEntrada('1000000')).toBe('1.000.000')
    expect(formatearMilesEntrada('')).toBe('')
  })

  it('separa los dígitos de la entrada', () => {
    expect(formatearMilesEntrada('8.000')).toBe('8.000')
    expect(parsearMiles('8.000')).toBe(8000)
    expect(parsearMiles('')).toBeNull()
  })

  it('publica los atajos 2.000, 5.000 y 10.000', () => {
    expect([...ATAJOS_PROPINA]).toEqual([2000, 5000, 10000])
  })
})

describe('validarMotivoCancelacion', () => {
  it('recorta espacios', () => {
    const resultado = validarMotivoCancelacion('  Se enfermó  ')
    expect(resultado.motivo).toBe('Se enfermó')
    expect(resultado.valido).toBe(true)
  })

  it('acepta 255 caracteres y rechaza 256', () => {
    const de255 = 'a'.repeat(255)
    const de256 = 'a'.repeat(256)

    expect(validarMotivoCancelacion(de255).valido).toBe(true)
    expect(validarMotivoCancelacion(de255).longitud).toBe(MOTIVO_MAXIMO)

    const resultado = validarMotivoCancelacion(de256)
    expect(resultado.valido).toBe(false)
    expect(resultado.error).toContain('255')
  })

  it('permite el motivo vacío', () => {
    const resultado = validarMotivoCancelacion('   ')
    expect(resultado.valido).toBe(true)
    expect(resultado.motivo).toBe('')
  })
})
