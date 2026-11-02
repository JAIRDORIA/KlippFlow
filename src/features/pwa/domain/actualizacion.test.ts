import { describe, expect, it } from 'vitest'
import {
  INTERVALO_COMPROBACION_MS,
  debeComprobarActualizacion,
} from './actualizacion'

const AHORA = Date.UTC(2026, 9, 31, 12, 0, 0)

describe('debeComprobarActualizacion', () => {
  it('comprueba la primera vez', () => {
    expect(debeComprobarActualizacion(null, AHORA)).toBe(true)
  })

  it('no repite antes de 30 minutos', () => {
    expect(debeComprobarActualizacion(AHORA - 60_000, AHORA)).toBe(false)
    expect(debeComprobarActualizacion(AHORA - INTERVALO_COMPROBACION_MS + 1, AHORA)).toBe(
      false,
    )
  })

  it('comprueba justo a los 30 minutos y después', () => {
    expect(debeComprobarActualizacion(AHORA - INTERVALO_COMPROBACION_MS, AHORA)).toBe(true)
    expect(debeComprobarActualizacion(AHORA - 31 * 60_000, AHORA)).toBe(true)
  })

  it('permite comprobar si el reloj retrocede', () => {
    expect(debeComprobarActualizacion(AHORA + 5 * 60_000, AHORA)).toBe(true)
  })

  it('acepta un intervalo propio', () => {
    expect(debeComprobarActualizacion(AHORA - 2_000, AHORA, 1_000)).toBe(true)
    expect(debeComprobarActualizacion(AHORA - 500, AHORA, 1_000)).toBe(false)
  })

  it('con valores inválidos comprueba', () => {
    expect(debeComprobarActualizacion(Number.NaN, AHORA)).toBe(true)
    expect(debeComprobarActualizacion(AHORA, Number.NaN)).toBe(true)
  })
})
