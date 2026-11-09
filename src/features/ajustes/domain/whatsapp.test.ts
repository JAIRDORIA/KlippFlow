import { describe, expect, it } from 'vitest'
import {
  construirCuerpoWhatsapp,
  esWhatsappValido,
  MENSAJE_ACTIVAR_SIN_CELULAR,
  MENSAJE_CELULAR_INVALIDO,
  puedeActivarWhatsapp,
  validarWhatsapp,
} from './whatsapp'

describe('validarWhatsapp', () => {
  it('acepta un celular de 10 dígitos', () => {
    expect(validarWhatsapp('3001234567', true)).toEqual({})
    expect(esWhatsappValido('3001234567', true)).toBe(true)
  })

  it('acepta +57 y espacios', () => {
    expect(validarWhatsapp('+57 300 123 4567', true)).toEqual({})
    expect(validarWhatsapp('300 123 4567', false)).toEqual({})
  })

  it('rechaza un celular inválido', () => {
    expect(validarWhatsapp('12345', false)).toEqual({
      celular: MENSAJE_CELULAR_INVALIDO,
    })
    expect(validarWhatsapp('300123456', true)).toEqual({
      celular: MENSAJE_CELULAR_INVALIDO,
      activo: MENSAJE_ACTIVAR_SIN_CELULAR,
    })
  })

  it('no deja activar sin celular válido', () => {
    expect(validarWhatsapp('', true)).toEqual({
      activo: MENSAJE_ACTIVAR_SIN_CELULAR,
    })
    expect(puedeActivarWhatsapp('')).toBe(false)
    expect(puedeActivarWhatsapp('3001234567')).toBe(true)
  })
})

describe('construirCuerpoWhatsapp', () => {
  it('normaliza el celular al activar', () => {
    expect(construirCuerpoWhatsapp('+57 300 123 4567', true)).toEqual({
      celular: '3001234567',
      activo: true,
    })
  })

  it('envía el celular también al desactivar si está escrito', () => {
    expect(construirCuerpoWhatsapp('300 123 4567', false)).toEqual({
      celular: '3001234567',
      activo: false,
    })
  })

  it('omite el celular al apagar con el campo vacío', () => {
    expect(construirCuerpoWhatsapp('   ', false)).toEqual({ activo: false })
  })

  it('no construye el cuerpo si activa sin celular o el celular es inválido', () => {
    expect(construirCuerpoWhatsapp('', true)).toBeNull()
    expect(construirCuerpoWhatsapp('12345', true)).toBeNull()
    expect(construirCuerpoWhatsapp('12345', false)).toBeNull()
  })
})
