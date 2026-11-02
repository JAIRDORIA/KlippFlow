import { describe, expect, it } from 'vitest'
import { calcularCuentaRegresiva } from './cuentaRegresiva'

const OBTENIDO = 1_000_000

describe('calcularCuentaRegresiva', () => {
  it('muestra los minutos restantes', () => {
    expect(calcularCuentaRegresiva(38, OBTENIDO, OBTENIDO)).toEqual({
      vencida: false,
      minutos: 38,
      texto: 'expira en 38 min',
    })
  })

  it('usa horas y minutos pasados de 59', () => {
    expect(calcularCuentaRegresiva(72, OBTENIDO, OBTENIDO)).toEqual({
      vencida: false,
      minutos: 72,
      texto: 'expira en 1 h 12 min',
    })
  })

  it('avisa cuando queda menos de un minuto', () => {
    const ahora = OBTENIDO + 45_000
    expect(calcularCuentaRegresiva(1, OBTENIDO, ahora)).toEqual({
      vencida: false,
      minutos: 1,
      texto: 'expira en menos de 1 min',
    })
  })

  it('marca vencida al llegar a 0', () => {
    expect(calcularCuentaRegresiva(0, OBTENIDO, OBTENIDO)).toEqual({
      vencida: true,
      minutos: 0,
      texto: 'expirada',
    })
  })

  it('tiene en cuenta el tiempo transcurrido desde que se obtuvo el dato', () => {
    const ahora = OBTENIDO + 10 * 60_000
    expect(calcularCuentaRegresiva(38, OBTENIDO, ahora)?.minutos).toBe(28)
    expect(calcularCuentaRegresiva(38, OBTENIDO, ahora)?.texto).toBe('expira en 28 min')
  })

  it('marca vencida cuando el tiempo transcurrido supera el total', () => {
    const ahora = OBTENIDO + 40 * 60_000
    expect(calcularCuentaRegresiva(38, OBTENIDO, ahora)?.vencida).toBe(true)
  })

  it('devuelve null sin dato de minutos', () => {
    expect(calcularCuentaRegresiva(null, OBTENIDO, OBTENIDO)).toBeNull()
    expect(calcularCuentaRegresiva(undefined, OBTENIDO, OBTENIDO)).toBeNull()
  })
})
