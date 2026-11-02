import { describe, expect, it } from 'vitest'
import type { CitaBarbero } from '../types'
import {
  acompanantesDeCita,
  calcularContadores,
  estadoVisualCita,
  minutosEntreHoras,
  nombreCliente,
  propinaDeCita,
  seleccionarProximaCita,
  serviciosDeCita,
} from './agenda'
import { encabezadoHoy, primerNombre } from './hoy'

function cita(parcial: Partial<CitaBarbero> & { id: number }): CitaBarbero {
  return {
    estado: 'aceptada',
    fecha: '2026-10-30',
    horaInicio: '10:00',
    horaFin: '10:30',
    cliente: { nombre: 'TEST-Ana', celular: '3001110001', correo: null },
    numPersonas: 1,
    montoTotal: 20000,
    personas: [
      {
        esTitular: true,
        nombre: 'TEST-Ana',
        duracionTotalMinutos: 30,
        servicios: [{ nombre: 'Corte', precio: 20000, duracionMinutos: 30 }],
      },
    ],
    minutosFueraHorario: 0,
    avisoDescanso: null,
    creadaEn: '2026-10-29T12:00:00.000Z',
    ...parcial,
  }
}

describe('minutosEntreHoras', () => {
  it('calcula la duración dentro de la misma hora', () => {
    expect(minutosEntreHoras('09:00', '09:30')).toBe(30)
  })

  it('calcula una cita que cruza el mediodía', () => {
    expect(minutosEntreHoras('11:30', '12:20')).toBe(50)
  })

  it('calcula una cita que cruza la medianoche', () => {
    expect(minutosEntreHoras('23:30', '00:30')).toBe(60)
  })

  it('devuelve 0 con horas inválidas', () => {
    expect(minutosEntreHoras('25:00', '10:00')).toBe(0)
    expect(minutosEntreHoras('10:00', '10')).toBe(0)
  })
})

describe('seleccionarProximaCita', () => {
  it('devuelve null sin citas', () => {
    expect(seleccionarProximaCita([])).toBeNull()
  })

  it('elige la primera aceptada por hora de inicio', () => {
    const citas = [
      cita({ id: 3, horaInicio: '15:00', horaFin: '15:30' }),
      cita({ id: 1, horaInicio: '09:00', horaFin: '09:30' }),
      cita({ id: 2, horaInicio: '12:00', horaFin: '12:30' }),
    ]
    expect(seleccionarProximaCita(citas)?.id).toBe(1)
  })

  it('ignora atendidas y no asistió', () => {
    const citas = [
      cita({ id: 1, horaInicio: '09:00', estado: 'atendida' }),
      cita({ id: 2, horaInicio: '10:00', estado: 'no_asistio' }),
      cita({ id: 3, horaInicio: '11:00' }),
    ]
    expect(seleccionarProximaCita(citas)?.id).toBe(3)
  })

  it('devuelve null si todas ya se cerraron', () => {
    const citas = [
      cita({ id: 1, estado: 'atendida' }),
      cita({ id: 2, estado: 'no_asistio' }),
    ]
    expect(seleccionarProximaCita(citas)).toBeNull()
  })
})

describe('estadoVisualCita', () => {
  it('marca atendida, no asistió, próxima y futura', () => {
    expect(estadoVisualCita(cita({ id: 1, estado: 'atendida' }), null)).toBe('atendida')
    expect(estadoVisualCita(cita({ id: 1, estado: 'no_asistio' }), null)).toBe('noAsistio')
    expect(estadoVisualCita(cita({ id: 1 }), 1)).toBe('proxima')
    expect(estadoVisualCita(cita({ id: 2 }), 1)).toBe('futura')
  })

  it('sin próxima cita, una aceptada queda como futura', () => {
    expect(estadoVisualCita(cita({ id: 1 }), null)).toBe('futura')
  })
})

describe('calcularContadores', () => {
  it('toma los conteos documentados del resumen', () => {
    expect(
      calcularContadores({
        citasHoy: 4,
        aceptadas: 2,
        atendidas: 1,
        noAsistio: 1,
        solicitudesPendientes: 3,
      }),
    ).toEqual({ porAtender: 2, atendidos: 1, solicitudes: 3 })
  })

  it('sin resumen devuelve ceros', () => {
    expect(calcularContadores(null)).toEqual({
      porAtender: 0,
      atendidos: 0,
      solicitudes: 0,
    })
  })

  it('normaliza valores negativos o inválidos', () => {
    expect(
      calcularContadores({
        citasHoy: 0,
        aceptadas: -1,
        atendidas: Number.NaN,
        noAsistio: 0,
        solicitudesPendientes: 2.7,
      }),
    ).toEqual({ porAtender: 0, atendidos: 0, solicitudes: 2 })
  })
})

describe('detalles de la cita', () => {
  it('junta los servicios sin repetir', () => {
    const conAcompanante = cita({
      id: 1,
      personas: [
        {
          esTitular: true,
          nombre: 'TEST-Ana',
          duracionTotalMinutos: 30,
          servicios: [{ nombre: 'Corte', precio: 20000, duracionMinutos: 30 }],
        },
        {
          esTitular: false,
          nombre: 'TEST-Hijo',
          duracionTotalMinutos: 30,
          servicios: [{ nombre: 'Corte', precio: 20000, duracionMinutos: 30 }],
        },
      ],
    })

    expect(serviciosDeCita(conAcompanante)).toEqual(['Corte'])
  })

  it('devuelve acompañantes con nombre nulo y sus servicios', () => {
    const conAcompanante = cita({
      id: 1,
      personas: [
        {
          esTitular: true,
          nombre: 'TEST-Ana',
          duracionTotalMinutos: 30,
          servicios: [{ nombre: 'Corte', precio: 20000, duracionMinutos: 30 }],
        },
        {
          esTitular: false,
          nombre: null,
          duracionTotalMinutos: 20,
          servicios: [{ nombre: 'Barba', precio: 10000, duracionMinutos: 20 }],
        },
      ],
    })

    expect(acompanantesDeCita(conAcompanante)).toEqual([
      { nombre: null, servicios: ['Barba'] },
    ])
  })

  it('usa el nombre del cliente y cae al titular si falta', () => {
    expect(nombreCliente(cita({ id: 1 }))).toBe('TEST-Ana')
    expect(nombreCliente(cita({ id: 1, cliente: null }))).toBe('TEST-Ana')
    expect(
      nombreCliente(
        cita({
          id: 1,
          cliente: null,
          personas: [
            {
              esTitular: true,
              nombre: null,
              duracionTotalMinutos: 30,
              servicios: [],
            },
          ],
        }),
      ),
    ).toBe('Cliente')
  })

  it('lee la propina de la atención y trata null/0 como sin propina', () => {
    expect(
      propinaDeCita(
        cita({
          id: 1,
          estado: 'atendida',
          atencion: { montoCobrado: 20000, saldoCobrado: 20000, montoPropina: 5000 },
        }),
      ),
    ).toBe(5000)
    expect(
      propinaDeCita(
        cita({
          id: 1,
          estado: 'atendida',
          atencion: { montoCobrado: 20000, saldoCobrado: 20000, montoPropina: null },
        }),
      ),
    ).toBe(0)
    expect(propinaDeCita(cita({ id: 1 }))).toBe(0)
  })
})

describe('encabezadoHoy', () => {
  it('saluda según la hora de Bogotá y usa el primer nombre', () => {
    // 2026-10-30 14:00 UTC = 09:00 en Bogotá
    const manana = encabezadoHoy('Barbero Prueba', new Date('2026-10-30T14:00:00Z'))
    expect(manana.titulo).toBe('Buen día, Barbero')
    expect(manana.eyebrow).toBe('VIERNES · 30 OCT')

    // 2026-10-30 18:00 UTC = 13:00 en Bogotá
    expect(
      encabezadoHoy('Ana', new Date('2026-10-30T18:00:00Z')).titulo,
    ).toBe('Buenas tardes, Ana')

    // 2026-10-31 01:00 UTC = 20:00 en Bogotá del día 30
    const noche = encabezadoHoy('Ana', new Date('2026-10-31T01:00:00Z'))
    expect(noche.titulo).toBe('Buenas noches, Ana')
    expect(noche.eyebrow).toBe('VIERNES · 30 OCT')
  })

  it('cambia el día a medianoche de Bogotá con la app abierta', () => {
    const antes = encabezadoHoy('Ana', new Date('2026-10-31T04:59:00Z'))
    const despues = encabezadoHoy('Ana', new Date('2026-10-31T05:01:00Z'))

    expect(antes.eyebrow).toBe('VIERNES · 30 OCT')
    expect(antes.titulo).toBe('Buenas noches, Ana')
    expect(despues.eyebrow).toBe('SÁBADO · 31 OCT')
    expect(despues.titulo).toBe('Buen día, Ana')
  })

  it('sin nombre deja solo el saludo', () => {
    expect(encabezadoHoy(null, new Date('2026-10-30T14:00:00Z')).titulo).toBe('Buen día')
  })

  it('primerNombre tolera nulos y espacios', () => {
    expect(primerNombre(null)).toBe('')
    expect(primerNombre('   ')).toBe('')
    expect(primerNombre('  Juan   Pérez ')).toBe('Juan')
  })
})
