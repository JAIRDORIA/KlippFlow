import { describe, expect, it } from 'vitest'
import type { ServicioPublico } from '../types'
import {
  construirCuerpoCrearCita,
  crearEstadoInicial,
  esFormularioValido,
  MAXIMO_ACOMPANANTES,
  reducerFormularioReserva,
  seleccionParaTotales,
  validarDatos,
  type AccionFormularioReserva,
  type EstadoFormularioReserva,
} from './formulario'

const SERVICIOS: ServicioPublico[] = [
  {
    id: 1,
    nombre: 'TEST-Corte',
    descripcion: null,
    precio: 30000,
    duracionMinutos: 45,
  },
  {
    id: 2,
    nombre: 'TEST-Barba',
    descripcion: null,
    precio: 18000,
    duracionMinutos: 30,
  },
  {
    id: 3,
    nombre: 'TEST-Cejas',
    descripcion: null,
    precio: 10000,
    duracionMinutos: 15,
  },
  {
    id: 4,
    nombre: 'TEST-Cinco',
    descripcion: null,
    precio: 5000,
    duracionMinutos: 5,
  },
]

function aplicar(
  estado: EstadoFormularioReserva,
  ...acciones: AccionFormularioReserva[]
): EstadoFormularioReserva {
  return acciones.reduce(reducerFormularioReserva, estado)
}

function cambiarDato(
  estado: EstadoFormularioReserva,
  campo: 'nombre' | 'celular' | 'correo',
  valor: string,
): EstadoFormularioReserva {
  return reducerFormularioReserva(estado, { tipo: 'cambiar-dato', campo, valor })
}

function conDatosValidos(estado: EstadoFormularioReserva): EstadoFormularioReserva {
  return aplicar(
    estado,
    { tipo: 'cambiar-dato', campo: 'nombre', valor: '  Juan Pérez  ' },
    { tipo: 'cambiar-dato', campo: 'celular', valor: '+57 300 123 4567' },
    { tipo: 'cambiar-dato', campo: 'correo', valor: ' juan@example.com ' },
  )
}

function baseConTitularYHora(): EstadoFormularioReserva {
  return conDatosValidos(
    aplicar(
      crearEstadoInicial('2026-10-29'),
      { tipo: 'alternar-servicio-titular', servicioId: 1 },
      { tipo: 'seleccionar-hora', horaInicio: '09:00' },
    ),
  )
}

describe('reducerFormularioReserva', () => {
  it('parte sin servicios, sin acompañantes y sin hora', () => {
    expect(crearEstadoInicial('2026-10-29')).toMatchObject({
      serviciosTitular: [],
      modo: 'solo',
      acompanantes: [],
      fecha: '2026-10-29',
      horaInicio: null,
    })
  })

  it('descarta la hora al cambiar servicios del titular', () => {
    const estado = baseConTitularYHora()
    const siguiente = reducerFormularioReserva(estado, {
      tipo: 'alternar-servicio-titular',
      servicioId: 2,
    })
    expect(siguiente.horaInicio).toBeNull()
    expect(siguiente.serviciosTitular).toEqual([1, 2])
  })

  it('agrega el primer acompañante al cambiar de modo y descarta la hora', () => {
    const estado = baseConTitularYHora()
    const siguiente = reducerFormularioReserva(estado, {
      tipo: 'cambiar-modo',
      modo: 'acompanantes',
    })
    expect(siguiente.modo).toBe('acompanantes')
    expect(siguiente.acompanantes).toHaveLength(1)
    expect(siguiente.horaInicio).toBeNull()
  })

  it('permite hasta 3 acompañantes y el cuarto no se agrega', () => {
    let estado = aplicar(crearEstadoInicial('2026-10-29'), {
      tipo: 'cambiar-modo',
      modo: 'acompanantes',
    })
    estado = aplicar(
      estado,
      { tipo: 'agregar-acompanante' },
      { tipo: 'agregar-acompanante' },
      { tipo: 'agregar-acompanante' },
    )
    expect(estado.acompanantes).toHaveLength(MAXIMO_ACOMPANANTES)
  })

  it('al quitar el último acompañante vuelve a modo solo', () => {
    let estado = aplicar(crearEstadoInicial('2026-10-29'), {
      tipo: 'cambiar-modo',
      modo: 'acompanantes',
    })
    const id = estado.acompanantes[0]?.id
    expect(id).toBeDefined()
    estado = reducerFormularioReserva(estado, {
      tipo: 'quitar-acompanante',
      id: id ?? 0,
    })
    expect(estado.modo).toBe('solo')
    expect(estado.acompanantes).toEqual([])
  })

  it('permite varios servicios por acompañante y descarta la hora', () => {
    const estado = aplicar(
      baseConTitularYHora(),
      { tipo: 'cambiar-modo', modo: 'acompanantes' },
      { tipo: 'seleccionar-hora', horaInicio: '10:00' },
    )
    const acompanante = estado.acompanantes[0]
    expect(acompanante).toBeDefined()
    if (!acompanante) return

    const siguiente = aplicar(
      estado,
      { tipo: 'alternar-servicio-acompanante', id: acompanante.id, servicioId: 2 },
      { tipo: 'alternar-servicio-acompanante', id: acompanante.id, servicioId: 3 },
    )
    expect(siguiente.acompanantes[0]?.servicioIds).toEqual([2, 3])
    expect(siguiente.horaInicio).toBeNull()
  })

  it('descarta la hora al cambiar de día', () => {
    const siguiente = reducerFormularioReserva(baseConTitularYHora(), {
      tipo: 'cambiar-fecha',
      fecha: '2026-10-30',
    })
    expect(siguiente.fecha).toBe('2026-10-30')
    expect(siguiente.horaInicio).toBeNull()
  })

  it('no descarta la hora al cambiar datos personales', () => {
    const siguiente = cambiarDato(baseConTitularYHora(), 'nombre', 'Ana')
    expect(siguiente.horaInicio).toBe('09:00')
  })
})

describe('validarDatos', () => {
  it('valida nombre, celular y correo opcional', () => {
    expect(
      validarDatos({ nombre: 'A', celular: '2001234567', correo: 'mal' }),
    ).toEqual({
      nombre: 'Escribe tu nombre.',
      celular: 'Escribe un celular de 10 dígitos que empiece por 3.',
      correo: 'Escribe un correo válido.',
    })

    expect(
      validarDatos({
        nombre: 'Ana',
        celular: '+57 300 123 4567',
        correo: 'ana@example.com',
      }),
    ).toEqual({})
    expect(
      validarDatos({ nombre: 'Ana', celular: '3001234567', correo: '   ' }),
    ).toEqual({})
  })
})

describe('esFormularioValido', () => {
  it('exige servicio, hora, fecha y datos válidos', () => {
    const valido = baseConTitularYHora()
    expect(esFormularioValido(valido, SERVICIOS)).toBe(true)

    expect(
      esFormularioValido({ ...valido, serviciosTitular: [] }, SERVICIOS),
    ).toBe(false)
    expect(esFormularioValido({ ...valido, horaInicio: null }, SERVICIOS)).toBe(false)
    expect(esFormularioValido({ ...valido, fecha: '' }, SERVICIOS)).toBe(false)
    expect(
      esFormularioValido(
        cambiarDato(valido, 'celular', '2001234567'),
        SERVICIOS,
      ),
    ).toBe(false)
    expect(
      esFormularioValido(cambiarDato(valido, 'correo', 'mal'), SERVICIOS),
    ).toBe(false)
  })

  it('exige al menos un servicio por acompañante', () => {
    let estado = aplicar(baseConTitularYHora(), {
      tipo: 'cambiar-modo',
      modo: 'acompanantes',
    })
    estado = reducerFormularioReserva(estado, {
      tipo: 'seleccionar-hora',
      horaInicio: '09:00',
    })
    expect(esFormularioValido(estado, SERVICIOS)).toBe(false)

    const acompanante = estado.acompanantes[0]
    if (!acompanante) throw new Error('Falta acompañante')
    const conServicio = reducerFormularioReserva(estado, {
      tipo: 'alternar-servicio-acompanante',
      id: acompanante.id,
      servicioId: 3,
    })
    const conHora = reducerFormularioReserva(conServicio, {
      tipo: 'seleccionar-hora',
      horaInicio: '09:00',
    })
    expect(esFormularioValido(conHora, SERVICIOS)).toBe(true)
  })

  it('acepta una duración total de 5 minutos', () => {
    const estado = conDatosValidos(
      aplicar(
        crearEstadoInicial('2026-10-29'),
        { tipo: 'alternar-servicio-titular', servicioId: 4 },
        { tipo: 'seleccionar-hora', horaInicio: '09:00' },
      ),
    )
    expect(esFormularioValido(estado, SERVICIOS)).toBe(true)
  })

  it('acepta 600 minutos y rechaza 605', () => {
    const catalogo: ServicioPublico[] = [
      {
        id: 10,
        nombre: 'TEST-Largo',
        descripcion: null,
        precio: 100000,
        duracionMinutos: 480,
      },
      {
        id: 11,
        nombre: 'TEST-Medio',
        descripcion: null,
        precio: 30000,
        duracionMinutos: 120,
      },
      {
        id: 12,
        nombre: 'TEST-Exceso',
        descripcion: null,
        precio: 30000,
        duracionMinutos: 125,
      },
    ]
    const base = (ids: number[]) =>
      conDatosValidos(
        aplicar(
          crearEstadoInicial('2026-10-29'),
          ...ids.map(
            (servicioId): AccionFormularioReserva => ({
              tipo: 'alternar-servicio-titular',
              servicioId,
            }),
          ),
          { tipo: 'seleccionar-hora', horaInicio: '09:00' },
        ),
      )

    expect(esFormularioValido(base([10, 11]), catalogo)).toBe(true)
    expect(esFormularioValido(base([10, 12]), catalogo)).toBe(false)
  })

  it('rechaza más de 10 servicios en una persona', () => {
    const catalogo: ServicioPublico[] = Array.from({ length: 11 }, (_, indice) => ({
      id: indice + 20,
      nombre: `TEST-${indice}`,
      descripcion: null,
      precio: 5000,
      duracionMinutos: 5,
    }))
    const estado = conDatosValidos(
      aplicar(
        crearEstadoInicial('2026-10-29'),
        ...catalogo.map(
          (servicio): AccionFormularioReserva => ({
            tipo: 'alternar-servicio-titular',
            servicioId: servicio.id,
          }),
        ),
        { tipo: 'seleccionar-hora', horaInicio: '09:00' },
      ),
    )
    expect(esFormularioValido(estado, catalogo)).toBe(false)
    expect(construirCuerpoCrearCita(estado, catalogo)).toBeNull()
  })
})

describe('construirCuerpoCrearCita', () => {
  it('construye el cuerpo documentado con varios servicios por acompañante', () => {
    let estado = aplicar(
      baseConTitularYHora(),
      { tipo: 'alternar-servicio-titular', servicioId: 2 },
      { tipo: 'cambiar-modo', modo: 'acompanantes' },
    )
    const acompanante = estado.acompanantes[0]
    if (!acompanante) throw new Error('Falta acompañante')

    estado = aplicar(
      estado,
      { tipo: 'alternar-servicio-acompanante', id: acompanante.id, servicioId: 2 },
      { tipo: 'alternar-servicio-acompanante', id: acompanante.id, servicioId: 3 },
      { tipo: 'seleccionar-hora', horaInicio: '09:00' },
    )

    expect(construirCuerpoCrearCita(estado, SERVICIOS)).toEqual({
      nombre: 'Juan Pérez',
      celular: '3001234567',
      correo: 'juan@example.com',
      fecha: '2026-10-29',
      horaInicio: '09:00',
      personas: [{ servicioIds: [1, 2] }, { servicioIds: [2, 3] }],
    })
  })

  it('omite el correo cuando está vacío', () => {
    const estado = cambiarDato(baseConTitularYHora(), 'correo', '')
    const cuerpo = construirCuerpoCrearCita(estado, SERVICIOS)
    expect(cuerpo).not.toBeNull()
    expect(cuerpo).not.toHaveProperty('correo')
  })

  it('permite 4 personas contando al titular', () => {
    let estado = aplicar(
      baseConTitularYHora(),
      { tipo: 'cambiar-modo', modo: 'acompanantes' },
      { tipo: 'agregar-acompanante' },
      { tipo: 'agregar-acompanante' },
    )
    for (const acompanante of estado.acompanantes) {
      estado = reducerFormularioReserva(estado, {
        tipo: 'alternar-servicio-acompanante',
        id: acompanante.id,
        servicioId: 3,
      })
    }
    estado = reducerFormularioReserva(estado, {
      tipo: 'seleccionar-hora',
      horaInicio: '09:00',
    })

    const cuerpo = construirCuerpoCrearCita(estado, SERVICIOS)
    expect(cuerpo?.personas).toHaveLength(4)
  })

  it('devuelve null sin servicios', () => {
    const estado = conDatosValidos(
      aplicar(crearEstadoInicial('2026-10-29'), {
        tipo: 'seleccionar-hora',
        horaInicio: '09:00',
      }),
    )
    expect(construirCuerpoCrearCita(estado, SERVICIOS)).toBeNull()
  })

  it('la selección para totales ignora acompañantes en modo solo', () => {
    const estado = baseConTitularYHora()
    expect(seleccionParaTotales({ ...estado, acompanantes: [{ id: 9, servicioIds: [3] }] }))
      .toEqual({ titular: [1], acompanantes: [] })
  })
})
