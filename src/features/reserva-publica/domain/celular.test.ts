import { describe, expect, it } from 'vitest'
import { celularValido, normalizarCelular } from './celular'

describe('normalizarCelular', () => {
  it('acepta diez dígitos que empiezan por 3', () => {
    expect(normalizarCelular('3001234567')).toBe('3001234567')
    expect(normalizarCelular('300 123 4567')).toBe('3001234567')
    expect(normalizarCelular('300-123-4567')).toBe('3001234567')
  })

  it('acepta +57 y 57 con espacios o guiones', () => {
    expect(normalizarCelular('+57 300 123 4567')).toBe('3001234567')
    expect(normalizarCelular('57 300 123 4567')).toBe('3001234567')
    expect(normalizarCelular('+57-300-123-4567')).toBe('3001234567')
    expect(normalizarCelular('573001234567')).toBe('3001234567')
  })

  it('recorta espacios exteriores', () => {
    expect(normalizarCelular('  300 123 4567  ')).toBe('3001234567')
  })

  it('rechaza letras y caracteres no permitidos', () => {
    expect(normalizarCelular('3001234567abc')).toBeNull()
    expect(normalizarCelular('300 123 456A')).toBeNull()
    expect(normalizarCelular('+57 300 123 4567 x')).toBeNull()
    expect(normalizarCelular('(300) 123-4567')).toBeNull()
  })

  it('rechaza números que no empiezan por 3 o tienen longitud incorrecta', () => {
    expect(normalizarCelular('2001234567')).toBeNull()
    expect(normalizarCelular('300123')).toBeNull()
    expect(normalizarCelular('30012345678')).toBeNull()
    expect(normalizarCelular('583001234567')).toBeNull()
    expect(normalizarCelular('')).toBeNull()
  })
})

describe('celularValido', () => {
  it('acompaña a la normalización', () => {
    expect(celularValido('+57 300 123 4567')).toBe(true)
    expect(celularValido('2001234567')).toBe(false)
  })
})
