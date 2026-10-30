import { describe, expect, it } from 'vitest'
import { hoyBogota } from '@/shared/lib/fechas'
import { generarDiasDisponibles } from './dias'

describe('generarDiasDisponibles', () => {
  it('genera hoy más 7 días (8 fechas) y marcó hoy', () => {
    const dias = generarDiasDisponibles('2026-10-29')

    expect(dias).toHaveLength(8)
    expect(dias[0]).toEqual({
      fecha: '2026-10-29',
      diaSemana: 'JUE',
      dia: 29,
      esHoy: true,
    })
    expect(dias[7]?.fecha).toBe('2026-11-05')
    expect(dias.filter((dia) => dia.esHoy)).toHaveLength(1)
  })

  it('cruza correctamente de mes', () => {
    const dias = generarDiasDisponibles('2026-10-31')
    expect(dias[0]?.fecha).toBe('2026-10-31')
    expect(dias[1]?.fecha).toBe('2026-11-01')
    expect(dias[7]?.fecha).toBe('2026-11-07')
  })

  it('cruza correctamente de año', () => {
    const dias = generarDiasDisponibles('2026-12-28')
    expect(dias[4]?.fecha).toBe('2027-01-01')
    expect(dias[7]?.fecha).toBe('2027-01-04')
  })

  it('parte del día de Bogotá aunque el equipo esté en otra zona', () => {
    // 2026-10-29 04:30 UTC = 2026-10-28 23:30 en Bogotá.
    const hoy = hoyBogota(new Date('2026-10-29T04:30:00Z'))
    const dias = generarDiasDisponibles(hoy)
    expect(dias[0]?.fecha).toBe('2026-10-28')
    expect(dias[1]?.fecha).toBe('2026-10-29')
  })

  it('devuelve vacío con una fecha inválida', () => {
    expect(generarDiasDisponibles('2026-02-30')).toEqual([])
  })
})
