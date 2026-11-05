import { describe, expect, it } from 'vitest'
import { puedeCrearCuenta } from './aceptacion'

describe('puedeCrearCuenta', () => {
  it('solo permite crear con formulario válido y autorización marcada', () => {
    expect(puedeCrearCuenta(true, true)).toBe(true)
    expect(puedeCrearCuenta(true, false)).toBe(false)
    expect(puedeCrearCuenta(false, true)).toBe(false)
    expect(puedeCrearCuenta(false, false)).toBe(false)
  })
})
