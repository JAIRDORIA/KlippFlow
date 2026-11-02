import { describe, expect, it } from 'vitest'
import {
  bloqueValido,
  bloquesSeCruzan,
  esHoraValida,
  esMultiploDe15,
  haySolape,
  horaA12,
  horaA24,
  minutosDeHora,
  normalizarHora,
  sumarMinutos,
} from './horas'

describe('formato de hora', () => {
  it('pasa de 24 h a 12 h con am y pm', () => {
    expect(horaA12('09:00')).toBe('9:00 am')
    expect(horaA12('13:00')).toBe('1:00 pm')
    expect(horaA12('00:00')).toBe('12:00 am')
    expect(horaA12('12:00')).toBe('12:00 pm')
    expect(horaA12('00:30')).toBe('12:30 am')
    expect(horaA12('12:30')).toBe('12:30 pm')
    expect(horaA12('23:45')).toBe('11:45 pm')
  })

  it('pasa de 12 h a 24 h', () => {
    expect(horaA24('09:00 a. m.')).toBe('09:00')
    expect(horaA24('01:00 p. m.')).toBe('13:00')
    expect(horaA24('12:00 a. m.')).toBe('00:00')
    expect(horaA24('12:00 p. m.')).toBe('12:00')
    expect(horaA24('9:00 a. m.')).toBe('09:00')
    expect(horaA24('1:00 pm')).toBe('13:00')
  })

  it('acepta 24 h directamente y rechaza lo inválido', () => {
    expect(horaA24('13:00')).toBe('13:00')
    expect(horaA24('25:00')).toBeNull()
    expect(horaA24('abc')).toBeNull()
    expect(horaA24('13:00 p. m.')).toBeNull()
  })

  it('hace ida y vuelta sin perder la hora', () => {
    for (const hora of ['00:00', '09:00', '12:00', '13:45', '23:45']) {
      expect(horaA24(horaA12(hora))).toBe(hora)
    }
  })

  it('normaliza HH:mm:ss del TIME de MySQL', () => {
    expect(normalizarHora('07:00:00')).toBe('07:00')
    expect(normalizarHora('07:00')).toBe('07:00')
    expect(normalizarHora('7:00')).toBeNull()
    expect(esHoraValida('23:59')).toBe(true)
    expect(esHoraValida('24:00')).toBe(false)
  })

  it('calcula minutos y múltiplos de 15', () => {
    expect(minutosDeHora('09:30')).toBe(570)
    expect(minutosDeHora('nada')).toBeNull()
    expect(esMultiploDe15('09:15')).toBe(true)
    expect(esMultiploDe15('09:10')).toBe(false)
  })

  it('suma minutos sin pasar de las 23:59', () => {
    expect(sumarMinutos('09:00', 60)).toBe('10:00')
    expect(sumarMinutos('23:45', 15)).toBeNull()
  })
})

describe('bloques', () => {
  it('exige fin mayor que inicio', () => {
    expect(bloqueValido('09:00', '13:00')).toBe(true)
    expect(bloqueValido('13:00', '13:00')).toBe(false)
    expect(bloqueValido('13:00', '09:00')).toBe(false)
  })

  it('permite bloques adyacentes y detecta cruces', () => {
    const manana = { horaInicio: '09:00', horaFin: '13:00' }

    expect(bloquesSeCruzan(manana, { horaInicio: '13:00', horaFin: '19:00' })).toBe(false)
    expect(bloquesSeCruzan(manana, { horaInicio: '12:00', horaFin: '15:00' })).toBe(true)

    expect(
      haySolape([
        { horaInicio: '09:00', horaFin: '13:00' },
        { horaInicio: '15:00', horaFin: '19:00' },
      ]),
    ).toBe(false)

    expect(
      haySolape([
        { horaInicio: '09:00', horaFin: '13:00' },
        { horaInicio: '12:30', horaFin: '15:00' },
        { horaInicio: '15:00', horaFin: '19:00' },
      ]),
    ).toBe(true)

    expect(haySolape([])).toBe(false)
  })
})
