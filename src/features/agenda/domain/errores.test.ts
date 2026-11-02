import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import { mensajeDeError } from './errores'

function error(status: number, mensaje = ''): ErrorPeticion {
  return new ErrorPeticion({ status, mensaje })
}

describe('mensajeDeError', () => {
  it('traduce el 409 de solicitud expirada', () => {
    const resultado = mensajeDeError(
      'aceptar',
      error(409, 'Esta solicitud expiró (pasaron más de 2 horas)'),
    )
    expect(resultado).toEqual({ mensaje: 'Esta solicitud ya expiró', refrescar: true })
  })

  it('reutiliza el mensaje de cruce de la API', () => {
    expect(
      mensajeDeError('aceptar', error(409, 'Se cruza con otra cita ya aceptada')),
    ).toEqual({ mensaje: 'Se cruza con otra cita ya aceptada', refrescar: true })
  })

  it('reutiliza el 409 de la propina y pide refrescar', () => {
    const mensaje = 'Solo puedes modificar la propina el mismo día de la atención'
    expect(mensajeDeError('propina', error(409, mensaje))).toEqual({
      mensaje,
      refrescar: true,
    })
  })

  it('usa el mensaje del 404 y refresca', () => {
    expect(mensajeDeError('cancelar', error(404, 'Cita no encontrada'))).toEqual({
      mensaje: 'Cita no encontrada',
      refrescar: true,
    })
    expect(mensajeDeError('propina', error(404, 'Atención no encontrada'))).toEqual({
      mensaje: 'Atención no encontrada',
      refrescar: true,
    })
  })

  it('usa el mensaje del 400 sin refrescar', () => {
    expect(
      mensajeDeError('rechazar', error(400, 'motivo must be a valid enum value')),
    ).toEqual({
      mensaje: 'motivo must be a valid enum value',
      refrescar: false,
    })
  })

  it('traduce el 429', () => {
    expect(
      mensajeDeError('aceptar', error(429, 'ThrottlerException: Too Many Requests')),
    ).toEqual({ mensaje: 'Demasiados intentos, espera un momento.', refrescar: false })
  })

  it('traduce el fallo de red', () => {
    expect(
      mensajeDeError('aceptar', error(0, 'No pudimos conectar. Revisa tu internet.')),
    ).toEqual({
      mensaje: 'No pudimos conectar. Revisa tu internet.',
      refrescar: false,
    })
  })

  it('cae al mensaje genérico con errores desconocidos', () => {
    expect(mensajeDeError('atendido', new Error('boom'))).toEqual({
      mensaje: 'Algo salió mal. Inténtalo de nuevo.',
      refrescar: false,
    })
  })
})
