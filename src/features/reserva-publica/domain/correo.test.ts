import { describe, expect, it } from 'vitest'
import { esCorreoValido, normalizarCorreo } from './correo'

describe('correo opcional', () => {
  it('vacío es válido y se normaliza a undefined', () => {
    expect(esCorreoValido('')).toBe(true)
    expect(esCorreoValido('   ')).toBe(true)
    expect(normalizarCorreo('   ')).toBeUndefined()
  })

  it('acepta correos con formato básico válido', () => {
    expect(esCorreoValido('juan@example.com')).toBe(true)
    expect(esCorreoValido(' juan.perez+test@example.co ')).toBe(true)
  })

  it('rechaza correos mal escritos', () => {
    expect(esCorreoValido('juan@')).toBe(false)
    expect(esCorreoValido('juan@example')).toBe(false)
    expect(esCorreoValido('juan example.com')).toBe(false)
    expect(esCorreoValido('@example.com')).toBe(false)
  })

  it('normaliza recortando espacios', () => {
    expect(normalizarCorreo(' juan@example.com ')).toBe('juan@example.com')
  })
})
