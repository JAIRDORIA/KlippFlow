import { describe, expect, it } from 'vitest'
import { etiquetaFechaSolicitud } from './fecha'

// 2026-10-30 15:00 UTC = 10:00 a. m. en Bogotá.
const REFERENCIA = new Date('2026-10-30T15:00:00Z')

describe('etiquetaFechaSolicitud', () => {
  it('marca hoy y mañana', () => {
    expect(etiquetaFechaSolicitud('2026-10-30', REFERENCIA)).toBe('Hoy')
    expect(etiquetaFechaSolicitud('2026-10-31', REFERENCIA)).toBe('Mañana')
  })

  it('usa el formato corto para otras fechas', () => {
    expect(etiquetaFechaSolicitud('2026-11-03', REFERENCIA)).toBe('mar 3 nov')
  })

  it('cruza la medianoche de Bogotá, no la del dispositivo', () => {
    // 2026-10-31 04:59 UTC = 30 de octubre 11:59 p. m. en Bogotá.
    const antesDeMedianoche = new Date('2026-10-31T04:59:00Z')
    expect(etiquetaFechaSolicitud('2026-10-30', antesDeMedianoche)).toBe('Hoy')
    expect(etiquetaFechaSolicitud('2026-10-31', antesDeMedianoche)).toBe('Mañana')
  })

  it('devuelve vacío con una fecha inválida', () => {
    expect(etiquetaFechaSolicitud('2026-13-40', REFERENCIA)).toBe('')
  })
})
