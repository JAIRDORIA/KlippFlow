import { describe, expect, it } from 'vitest'
import {
  calcularCuentaPropuesta,
  estaVigente,
  propuestaVigente,
  type PropuestaCambioHora,
} from './propuestaCambioHora'

const AHORA = Date.parse('2026-11-15T20:00:00.000Z')

function propuesta(expiraEn: string): PropuestaCambioHora {
  return {
    fecha: '2026-11-20',
    horaInicio: '09:00',
    horaFin: '09:30',
    creadaEn: '2026-11-15T19:30:00.000Z',
    expiraEn,
  }
}

describe('estaVigente', () => {
  it('sin propuesta no está vigente', () => {
    expect(estaVigente(null, AHORA)).toBe(false)
    expect(estaVigente(undefined, AHORA)).toBe(false)
  })

  it('es vigente antes de expirar', () => {
    expect(estaVigente(propuesta('2026-11-15T21:00:00.000Z'), AHORA)).toBe(true)
  })

  it('deja de estar vigente justo al expirar', () => {
    expect(estaVigente(propuesta('2026-11-15T20:00:00.000Z'), AHORA)).toBe(false)
  })

  it('asume vigente si expiraEn no se puede interpretar', () => {
    expect(estaVigente(propuesta('no-es-fecha'), AHORA)).toBe(true)
  })
})

describe('propuestaVigente', () => {
  it('devuelve la propuesta mientras viva', () => {
    const viva = propuesta('2026-11-15T20:45:00.000Z')
    expect(propuestaVigente(viva, AHORA)).toBe(viva)
  })

  it('devuelve null cuando ya venció', () => {
    expect(propuestaVigente(propuesta('2026-11-15T19:00:00.000Z'), AHORA)).toBeNull()
  })
})

describe('calcularCuentaPropuesta', () => {
  it('redondea hacia arriba los minutos restantes', () => {
    expect(calcularCuentaPropuesta(propuesta('2026-11-15T21:00:00.000Z'), AHORA)).toEqual({
      vigente: true,
      minutos: 60,
      texto: 'expira en 1 h',
    })
  })

  it('usa el formato corto cuando falta menos de una hora', () => {
    expect(
      calcularCuentaPropuesta(propuesta('2026-11-15T20:45:00.000Z'), AHORA),
    ).toEqual({ vigente: true, minutos: 45, texto: 'expira en 45 min' })
  })

  it('marca expirada cuando ya pasó', () => {
    expect(calcularCuentaPropuesta(propuesta('2026-11-15T19:59:00.000Z'), AHORA)).toEqual({
      vigente: false,
      minutos: 0,
      texto: 'propuesta expirada',
    })
  })

  it('sin fecha válida no hay cuenta', () => {
    expect(calcularCuentaPropuesta(propuesta('nope'), AHORA)).toBeNull()
    expect(calcularCuentaPropuesta(null, AHORA)).toBeNull()
  })
})
