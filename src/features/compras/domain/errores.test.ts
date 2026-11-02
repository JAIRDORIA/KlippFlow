import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import { mensajeDeErrorCompra } from './errores'

function error(status: number, mensaje = ''): ErrorPeticion {
  return new ErrorPeticion({ status, mensaje })
}

describe('mensajeDeErrorCompra', () => {
  it('traduce el 409 de otro día y pide refrescar', () => {
    expect(
      mensajeDeErrorCompra(
        error(409, 'Solo puedes modificar una compra el mismo día en que se registró'),
      ),
    ).toEqual({ mensaje: 'Esta compra ya no se puede modificar', refrescar: true })
  })

  it('usa el mensaje del 404 y refresca', () => {
    expect(mensajeDeErrorCompra(error(404, 'Compra no encontrada'))).toEqual({
      mensaje: 'Compra no encontrada',
      refrescar: true,
    })
    expect(mensajeDeErrorCompra(error(404))).toEqual({
      mensaje: 'Compra no encontrada',
      refrescar: true,
    })
  })

  it('usa el mensaje del 400 sin refrescar', () => {
    expect(mensajeDeErrorCompra(error(400, 'monto must not be greater than 50000000')))
      .toEqual({
        mensaje: 'monto must not be greater than 50000000',
        refrescar: false,
      })
  })

  it('traduce el 429', () => {
    expect(mensajeDeErrorCompra(error(429, 'ThrottlerException'))).toEqual({
      mensaje: 'Demasiados intentos, espera un momento.',
      refrescar: false,
    })
  })

  it('traduce el fallo de red', () => {
    expect(mensajeDeErrorCompra(error(0))).toEqual({
      mensaje: 'No pudimos conectar. Revisa tu internet.',
      refrescar: false,
    })
  })

  it('cae al mensaje genérico', () => {
    expect(mensajeDeErrorCompra(new Error('boom'))).toEqual({
      mensaje: 'Algo salió mal. Inténtalo de nuevo.',
      refrescar: false,
    })
  })
})
