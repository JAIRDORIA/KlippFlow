import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import { mensajeDeErrorAjustes } from './errores'

function error(status: number, mensaje = ''): ErrorPeticion {
  return new ErrorPeticion({ status, mensaje })
}

describe('mensajeDeErrorAjustes', () => {
  it('usa el mensaje del 400 sin refrescar', () => {
    expect(
      mensajeDeErrorAjustes(error(400, 'duracionMinutos debe ser múltiplo de 5')),
    ).toEqual({
      mensaje: 'duracionMinutos debe ser múltiplo de 5',
      refrescar: false,
    })
  })

  it('traduce el 409 de cruce de horarios', () => {
    expect(mensajeDeErrorAjustes(error(409), 'horario')).toEqual({
      mensaje: 'El horario se cruza con otro bloque de ese día',
      refrescar: true,
    })
  })

  it('reutiliza el mensaje del 409 cuando viene', () => {
    const mensaje = 'El horario se cruza con otro bloque de ese día'
    expect(mensajeDeErrorAjustes(error(409, mensaje), 'horario')).toEqual({
      mensaje,
      refrescar: true,
    })
  })

  it('usa el 404 correspondiente a cada sección', () => {
    expect(mensajeDeErrorAjustes(error(404), 'servicio')).toEqual({
      mensaje: 'Servicio no encontrado',
      refrescar: true,
    })
    expect(mensajeDeErrorAjustes(error(404), 'horario')).toEqual({
      mensaje: 'Horario no encontrado',
      refrescar: true,
    })
    expect(mensajeDeErrorAjustes(error(404, 'Servicio no encontrado'))).toEqual({
      mensaje: 'Servicio no encontrado',
      refrescar: true,
    })
  })

  it('traduce el 429', () => {
    expect(mensajeDeErrorAjustes(error(429, 'ThrottlerException'))).toEqual({
      mensaje: 'Demasiados intentos, espera un momento.',
      refrescar: false,
    })
  })

  it('traduce el fallo de red', () => {
    expect(mensajeDeErrorAjustes(error(0))).toEqual({
      mensaje: 'No pudimos conectar. Revisa tu internet.',
      refrescar: false,
    })
  })

  it('cae al mensaje genérico', () => {
    expect(mensajeDeErrorAjustes(new Error('boom'))).toEqual({
      mensaje: 'Algo salió mal. Inténtalo de nuevo.',
      refrescar: false,
    })
  })
})
