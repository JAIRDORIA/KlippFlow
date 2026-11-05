import { describe, expect, it } from 'vitest'
import type { ServicioPublico } from '../types'
import {
  construirCuerpoCitaCliente,
  crearEstadoInicial,
  esFormularioClienteValido,
  reducerFormularioReserva,
} from './formulario'

const SERVICIOS: ServicioPublico[] = [
  {
    id: 1,
    nombre: 'Corte',
    descripcion: null,
    precio: 30000,
    duracionMinutos: 30,
  },
  {
    id: 2,
    nombre: 'Barba',
    descripcion: null,
    precio: 15000,
    duracionMinutos: 15,
  },
]

function estadoBase() {
  let estado = crearEstadoInicial('2026-11-04')
  estado = reducerFormularioReserva(estado, {
    tipo: 'alternar-servicio-titular',
    servicioId: 1,
  })
  estado = reducerFormularioReserva(estado, {
    tipo: 'seleccionar-hora',
    horaInicio: '10:00',
  })
  return estado
}

describe('reserva con sesión de cliente', () => {
  it('es válida sin nombre, celular ni correo en el formulario', () => {
    const estado = estadoBase()
    expect(estado.datos).toEqual({ nombre: '', celular: '', correo: '' })
    expect(esFormularioClienteValido(estado, SERVICIOS)).toBe(true)
  })

  it('construye solo fecha, hora y personas', () => {
    const cuerpo = construirCuerpoCitaCliente(estadoBase(), SERVICIOS)

    expect(cuerpo).toEqual({
      fecha: '2026-11-04',
      horaInicio: '10:00',
      personas: [{ servicioIds: [1] }],
    })
    expect(cuerpo).not.toHaveProperty('nombre')
    expect(cuerpo).not.toHaveProperty('celular')
    expect(cuerpo).not.toHaveProperty('correo')
  })

  it('incluye acompañantes y rechaza horas vacías', () => {
    let estado = reducerFormularioReserva(estadoBase(), {
      tipo: 'cambiar-modo',
      modo: 'acompanantes',
    })
    const acompanante = estado.acompanantes[0]
    expect(acompanante).toBeDefined()
    if (!acompanante) return

    estado = reducerFormularioReserva(estado, {
      tipo: 'alternar-servicio-acompanante',
      id: acompanante.id,
      servicioId: 2,
    })
    estado = reducerFormularioReserva(estado, {
      tipo: 'seleccionar-hora',
      horaInicio: '10:00',
    })

    expect(construirCuerpoCitaCliente(estado, SERVICIOS)?.personas).toEqual([
      { servicioIds: [1] },
      { servicioIds: [2] },
    ])

    const sinHora = reducerFormularioReserva(estado, {
      tipo: 'seleccionar-hora',
      horaInicio: null,
    })
    expect(construirCuerpoCitaCliente(sinHora, SERVICIOS)).toBeNull()
  })
})
