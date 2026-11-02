import { describe, expect, it } from 'vitest'
import {
  ahoraBogota,
  etiquetaDia,
  eyebrowFecha,
  fechaCorta,
  fechaLarga,
  hora12,
  hoyBogota,
  saludo,
} from './fechas'

const TZ_EJEMPLO = 'America/Bogota'

describe('hoyBogota', () => {
  it('usa Bogotá y no la zona del dispositivo', () => {
    // 2026-10-29 04:30 UTC = 2026-10-28 23:30 en Bogotá (UTC-5).
    expect(hoyBogota(new Date('2026-10-29T04:30:00Z'))).toBe('2026-10-28')
    // 2026-10-29 05:00 UTC = 2026-10-29 00:00 en Bogotá.
    expect(hoyBogota(new Date('2026-10-29T05:00:00Z'))).toBe('2026-10-29')
  })

  it('cambia de año correctamente cerca de medianoche en Bogotá', () => {
    expect(hoyBogota(new Date('2027-01-01T04:59:00Z'))).toBe('2026-12-31')
    expect(hoyBogota(new Date('2027-01-01T05:00:00Z'))).toBe('2027-01-01')
  })
})

describe('ahoraBogota', () => {
  it('devuelve fecha y hora de Bogotá', () => {
    expect(ahoraBogota(new Date('2026-10-29T04:30:00Z'))).toEqual({
      fecha: '2026-10-28',
      hora: '23:30',
      horas: 23,
      minutos: 30,
    })
    expect(ahoraBogota(new Date('2026-10-29T05:00:00Z'))).toEqual({
      fecha: '2026-10-29',
      hora: '00:00',
      horas: 0,
      minutos: 0,
    })
  })
})

describe('etiquetaDia', () => {
  const referencia = new Date('2026-10-29T15:00:00Z') // 10:00 en Bogotá

  it('reconoce hoy y mañana', () => {
    expect(etiquetaDia('2026-10-29', referencia)).toBe('Hoy')
    expect(etiquetaDia('2026-10-30', referencia)).toBe('Mañana')
  })

  it('usa el formato corto para días posteriores', () => {
    expect(etiquetaDia('2026-10-31', referencia)).toBe('sáb 31 oct')
    expect(etiquetaDia('2026-11-02', referencia)).toBe('lun 2 nov')
  })

  it('cambia de mes y de año', () => {
    const finDeMes = new Date('2026-10-31T15:00:00Z')
    expect(etiquetaDia('2026-10-31', finDeMes)).toBe('Hoy')
    expect(etiquetaDia('2026-11-01', finDeMes)).toBe('Mañana')
    expect(etiquetaDia('2026-11-02', finDeMes)).toBe('lun 2 nov')

    const finDeAnio = new Date('2026-12-31T15:00:00Z')
    expect(etiquetaDia('2026-12-31', finDeAnio)).toBe('Hoy')
    expect(etiquetaDia('2027-01-01', finDeAnio)).toBe('Mañana')
    expect(etiquetaDia('2027-01-02', finDeAnio)).toBe('sáb 2 ene')
  })

  it('no se deja mover por la zona del equipo cerca de medianoche', () => {
    // En Bogotá todavía es 28 aunque en Tokio ya sea 29.
    const casiMedianoche = new Date('2026-10-29T04:30:00Z')
    expect(etiquetaDia('2026-10-28', casiMedianoche)).toBe('Hoy')
    expect(etiquetaDia('2026-10-29', casiMedianoche)).toBe('Mañana')
  })

  it('devuelve vacío con una fecha inválida', () => {
    expect(etiquetaDia('2026-02-30', referencia)).toBe('')
    expect(etiquetaDia('29/10/2026', referencia)).toBe('')
  })
})

describe('formatos de fecha', () => {
  it('eyebrowFecha produce LUNES · 26 OCT', () => {
    expect(eyebrowFecha('2026-10-26')).toBe('LUNES · 26 OCT')
  })

  it('fechaLarga produce lunes 26 de octubre', () => {
    expect(fechaLarga('2026-10-26')).toBe('lunes 26 de octubre')
  })

  it('fechaCorta produce Dom, 25 de oct', () => {
    expect(fechaCorta('2026-10-25')).toBe('Dom, 25 de oct')
  })

  it('formatea meses y años distintos', () => {
    expect(eyebrowFecha('2027-01-01')).toBe('VIERNES · 1 ENE')
    expect(fechaLarga('2026-12-31')).toBe('jueves 31 de diciembre')
    expect(fechaCorta('2027-01-01')).toBe('Vie, 1 de ene')
  })

  it('devuelve vacío con fechas inválidas', () => {
    expect(eyebrowFecha('2026-13-01')).toBe('')
    expect(fechaLarga('')).toBe('')
    expect(fechaCorta('2026-02-30')).toBe('')
  })
})

describe('saludo', () => {
  it('respeta los cortes de 12:00 y 19:00 en Bogotá', () => {
    expect(saludo(new Date('2026-10-29T11:00:00Z'))).toBe('Buen día') // 06:00
    expect(saludo(new Date('2026-10-29T16:59:00Z'))).toBe('Buen día') // 11:59
    expect(saludo(new Date('2026-10-29T17:00:00Z'))).toBe('Buenas tardes') // 12:00
    expect(saludo(new Date('2026-10-29T23:59:00Z'))).toBe('Buenas tardes') // 18:59
    expect(saludo(new Date('2026-10-30T00:00:00Z'))).toBe('Buenas noches') // 19:00
  })

  it('no depende de la zona del equipo', () => {
    // 2026-10-30 02:00 UTC = 2026-10-29 21:00 Bogotá.
    expect(saludo(new Date('2026-10-30T02:00:00Z'))).toBe('Buenas noches')
    expect(TZ_EJEMPLO).toBe('America/Bogota')
  })
})

describe('hora12', () => {
  it('convierte 24 h a 12 h con am y pm', () => {
    expect(hora12('09:00')).toBe('9:00 am')
    expect(hora12('00:00')).toBe('12:00 am')
    expect(hora12('11:59')).toBe('11:59 am')
    expect(hora12('12:00')).toBe('12:00 pm')
    expect(hora12('13:05')).toBe('1:05 pm')
    expect(hora12('23:45')).toBe('11:45 pm')
  })

  it('devuelve vacío para horas inválidas', () => {
    expect(hora12('24:00')).toBe('')
    expect(hora12('9:00')).toBe('')
    expect(hora12('09:60')).toBe('')
    expect(hora12('')).toBe('')
  })
})
