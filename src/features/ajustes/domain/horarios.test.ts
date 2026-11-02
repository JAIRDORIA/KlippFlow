import { describe, expect, it } from 'vitest'
import type { Horario } from '../types'
import {
  aBorrador,
  bloqueNuevo,
  filasDeHorario,
  hayCambiosDia,
  planificarGuardado,
  validarDia,
  type DiaBorrador,
} from './horarios'

function horario(parcial: Partial<Horario> & { id: number }): Horario {
  return {
    diaSemana: 1,
    horaInicio: '09:00',
    horaFin: '13:00',
    activo: true,
    ...parcial,
  }
}

function dia(
  diaSemana: number,
  activado: boolean,
  bloques: Array<Horario | { clave: string; id?: number; horaInicio: string; horaFin: string }>,
): DiaBorrador {
  return {
    diaSemana,
    activado,
    bloques: bloques.map((bloque) =>
      'clave' in bloque
        ? bloque
        : {
            clave: `servidor-${bloque.id}`,
            id: bloque.id,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
          },
    ),
  }
}

describe('filasDeHorario', () => {
  it('devuelve 7 filas de lunes a domingo aunque no haya horarios', () => {
    const filas = filasDeHorario([])

    expect(filas.map((fila) => fila.diaSemana)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(filas.map((fila) => fila.nombre)).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ])
    expect(filas.every((fila) => fila.activado === false)).toBe(true)
    expect(filas.every((fila) => fila.bloques.length === 0)).toBe(true)
  })

  it('agrupa los bloques por día, normaliza HH:mm:ss y los ordena', () => {
    const filas = filasDeHorario([
      horario({ id: 1, diaSemana: 1, horaInicio: '15:00:00', horaFin: '19:00:00' }),
      horario({ id: 2, diaSemana: 1, horaInicio: '09:00:00', horaFin: '13:00:00' }),
      horario({ id: 3, diaSemana: 0, horaInicio: '10:00', horaFin: '12:00', activo: false }),
    ])

    const lunes = filas[0]
    expect(lunes?.activado).toBe(true)
    expect(lunes?.bloques.map((bloque) => bloque.horaInicio)).toEqual(['09:00', '15:00'])
    expect(lunes?.bloques[0]?.horaFin).toBe('13:00')

    const domingo = filas[6]
    expect(domingo?.activado).toBe(false)
    expect(domingo?.bloques).toHaveLength(1)
  })

  it('marca el día activo si al menos un bloque está activo', () => {
    const filas = filasDeHorario([
      horario({ id: 1, diaSemana: 2, activo: false }),
      horario({ id: 2, diaSemana: 2, horaInicio: '15:00', horaFin: '19:00', activo: true }),
    ])

    expect(filas[1]?.activado).toBe(true)
  })
})

describe('validarDia', () => {
  it('acepta un día apagado sin bloques', () => {
    expect(validarDia({ diaSemana: 1, activado: false, bloques: [] })).toEqual({
      valido: true,
      error: null,
    })
  })

  it('exige un bloque cuando el día está encendido', () => {
    const resultado = validarDia({ diaSemana: 1, activado: true, bloques: [] })
    expect(resultado.valido).toBe(false)
    expect(resultado.error).toContain('bloque')
  })

  it('rechaza fin menor o igual al inicio', () => {
    const resultado = validarDia(
      dia(1, true, [{ clave: 'a', horaInicio: '13:00', horaFin: '09:00' }]),
    )
    expect(resultado.valido).toBe(false)
    expect(resultado.error).toContain('fin')
  })

  it('rechaza bloques que se cruzan y acepta adyacentes', () => {
    const cruce = validarDia(
      dia(1, true, [
        { clave: 'a', horaInicio: '09:00', horaFin: '13:00' },
        { clave: 'b', horaInicio: '12:00', horaFin: '15:00' },
      ]),
    )
    expect(cruce.valido).toBe(false)
    expect(cruce.error).toContain('cruzan')

    const adyacente = validarDia(
      dia(1, true, [
        { clave: 'a', horaInicio: '09:00', horaFin: '13:00' },
        { clave: 'b', horaInicio: '13:00', horaFin: '19:00' },
      ]),
    )
    expect(adyacente.valido).toBe(true)
  })

  it('exige horas en pasos de 15 minutos', () => {
    const resultado = validarDia(
      dia(1, true, [{ clave: 'a', horaInicio: '09:10', horaFin: '13:00' }]),
    )
    expect(resultado.valido).toBe(false)
    expect(resultado.error).toContain('15')
  })

  it('rechaza horas incompletas', () => {
    const resultado = validarDia(
      dia(1, true, [{ clave: 'a', horaInicio: '', horaFin: '13:00' }]),
    )
    expect(resultado.valido).toBe(false)
  })
})

describe('bloqueNuevo', () => {
  it('empieza donde termina el último y dura una hora', () => {
    const nuevo = bloqueNuevo(
      [{ clave: 'a', horaInicio: '09:00', horaFin: '13:00' }],
      'nuevo-1',
    )
    expect(nuevo).toEqual({
      clave: 'nuevo-1',
      horaInicio: '13:00',
      horaFin: '14:00',
    })
  })

  it('sin bloques empieza a las 09:00', () => {
    const nuevo = bloqueNuevo([], 'nuevo-1')
    expect(nuevo.horaInicio).toBe('09:00')
    expect(nuevo.horaFin).toBe('10:00')
  })
})

describe('hayCambiosDia', () => {
  const servidor = [horario({ id: 1 }), horario({ id: 2, horaInicio: '15:00', horaFin: '19:00' })]

  it('sin cambios devuelve false', () => {
    const borrador = { diaSemana: 1, ...aBorrador(servidor) }
    expect(hayCambiosDia(borrador, servidor)).toBe(false)
  })

  it('detecta cambios de hora, de bloques y del interruptor', () => {
    const borrador = { diaSemana: 1, ...aBorrador(servidor) }

    expect(
      hayCambiosDia(
        {
          ...borrador,
          bloques: borrador.bloques.map((bloque, indice) =>
            indice === 0 ? { ...bloque, horaInicio: '10:00' } : bloque,
          ),
        },
        servidor,
      ),
    ).toBe(true)

    expect(
      hayCambiosDia({ ...borrador, bloques: borrador.bloques.slice(0, 1) }, servidor),
    ).toBe(true)

    expect(hayCambiosDia({ ...borrador, activado: false }, servidor)).toBe(true)
  })
})

describe('planificarGuardado', () => {
  it('no hace nada si el borrador es igual al servidor', () => {
    const servidor = [horario({ id: 1 })]
    const borrador = { diaSemana: 1, ...aBorrador(servidor) }
    expect(planificarGuardado(borrador, servidor)).toEqual([])
  })

  it('apagar el día desactiva sus bloques sin borrarlos', () => {
    const servidor = [
      horario({ id: 1 }),
      horario({ id: 2, horaInicio: '15:00', horaFin: '19:00' }),
    ]
    const borrador = { diaSemana: 1, ...aBorrador(servidor), activado: false }

    expect(planificarGuardado(borrador, servidor)).toEqual([
      { tipo: 'editar', id: 1, cambios: { activo: false } },
      { tipo: 'editar', id: 2, cambios: { activo: false } },
    ])
  })

  it('encender un día sin bloques crea 09:00–13:00', () => {
    expect(
      planificarGuardado({ diaSemana: 3, activado: true, bloques: [] }, []),
    ).toEqual([
      {
        tipo: 'crear',
        diaSemana: 3,
        horaInicio: '09:00',
        horaFin: '13:00',
        activo: true,
      },
    ])
  })

  it('crea los bloques nuevos', () => {
    const operaciones = planificarGuardado(
      {
        diaSemana: 1,
        activado: true,
        bloques: [
          { clave: 'servidor-1', id: 1, horaInicio: '09:00', horaFin: '13:00' },
          { clave: 'nuevo-1', horaInicio: '15:00', horaFin: '19:00' },
        ],
      },
      [horario({ id: 1 })],
    )

    expect(operaciones).toEqual([
      {
        tipo: 'crear',
        diaSemana: 1,
        horaInicio: '15:00',
        horaFin: '19:00',
        activo: true,
      },
    ])
  })

  it('elimina los bloques que ya no están', () => {
    const servidor = [horario({ id: 1 }), horario({ id: 2, horaInicio: '15:00', horaFin: '19:00' })]

    expect(
      planificarGuardado(
        {
          diaSemana: 1,
          activado: true,
          bloques: [
            { clave: 'servidor-1', id: 1, horaInicio: '09:00', horaFin: '13:00' },
          ],
        },
        servidor,
      ),
    ).toEqual([{ tipo: 'eliminar', id: 2 }])
  })

  it('edita las horas cambiadas y reactiva un bloque inactivo', () => {
    const servidor = [horario({ id: 1, activo: false })]

    expect(
      planificarGuardado(
        {
          diaSemana: 1,
          activado: true,
          bloques: [{ clave: 'servidor-1', id: 1, horaInicio: '10:00', horaFin: '14:00' }],
        },
        servidor,
      ),
    ).toEqual([
      {
        tipo: 'editar',
        id: 1,
        cambios: { horaInicio: '10:00', horaFin: '14:00', activo: true },
      },
    ])
  })

  it('normaliza HH:mm:ss al comparar con el servidor', () => {
    const servidor = [
      horario({ id: 1, horaInicio: '09:00:00', horaFin: '13:00:00' }),
    ]
    const borrador = { diaSemana: 1, ...aBorrador(servidor) }

    expect(hayCambiosDia(borrador, servidor)).toBe(false)
    expect(planificarGuardado(borrador, servidor)).toEqual([])
  })
})
