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

describe('mensajeDeError al proponer otra hora', () => {
  it('traduce la solicitud expirada', () => {
    expect(
      mensajeDeError(
        'proponerCambioHora',
        error(409, 'Esta solicitud expiró (pasaron más de 2 horas)'),
      ),
    ).toEqual({
      mensaje: 'Esta solicitud ya expiró y no se puede reprogramar.',
      refrescar: true,
    })
  })

  it('explica que la cita ya comenzó', () => {
    expect(
      mensajeDeError('proponerCambioHora', error(409, 'Esta cita ya comenzó')),
    ).toEqual({
      mensaje: 'Esta cita ya comenzó; no se puede proponer otra hora.',
      refrescar: true,
    })
  })

  it('avisa cuando el cliente no tiene cuenta', () => {
    expect(
      mensajeDeError(
        'proponerCambioHora',
        error(409, 'El cliente no tiene una cuenta para confirmar el cambio'),
      ),
    ).toEqual({
      mensaje:
        'Este cliente no tiene cuenta de cliente, así que no puede confirmar el cambio.',
      refrescar: false,
    })
  })

  it('avisa cuando el horario se ocupó', () => {
    expect(
      mensajeDeError('proponerCambioHora', error(409, 'Ese horario ya no está disponible')),
    ).toEqual({
      mensaje: 'Ese horario ya no está disponible. Elige otro.',
      refrescar: true,
    })
  })

  it('reutiliza el mensaje del 400 sin refrescar', () => {
    expect(
      mensajeDeError(
        'proponerCambioHora',
        error(400, 'La nueva hora debe ser diferente a la actual'),
      ),
    ).toEqual({
      mensaje: 'La nueva hora debe ser diferente a la actual',
      refrescar: false,
    })
  })
})

describe('mensajeDeError de servicio sin cita', () => {
  it('pide recargar la lista cuando el servicio ya no vale', () => {
    expect(mensajeDeError('servicioSinCita', error(400, 'Servicio no válido'))).toEqual({
      mensaje:
        'Ese servicio ya no está disponible. Actualiza la lista e inténtalo de nuevo.',
      refrescar: true,
    })
  })

  it('señala el campo de celular', () => {
    expect(mensajeDeError('servicioSinCita', error(400, 'Celular no válido'))).toEqual({
      mensaje: 'Revisa el celular: deben ser 10 dígitos que empiecen por 3.',
      refrescar: false,
    })
  })

  it('explica que la propina no viaja con en_curso', () => {
    expect(
      mensajeDeError(
        'servicioSinCita',
        error(400, 'La propina se registra al marcar Atendido (modo en_curso)'),
      ),
    ).toEqual({
      mensaje: 'La propina solo se registra al marcar «Atendido».',
      refrescar: false,
    })
  })

  it('explica el rango de la duración total', () => {
    expect(
      mensajeDeError(
        'servicioSinCita',
        error(400, 'La duración total del servicio no es válida'),
      ),
    ).toEqual({
      mensaje: 'La duración total debe estar entre 5 y 600 minutos.',
      refrescar: false,
    })
  })

  it('muestra tal cual el 409 de cruce y propone releer la agenda', () => {
    expect(
      mensajeDeError(
        'servicioSinCita',
        error(409, 'Se cruza con la cita aceptada de las 10:00'),
      ),
    ).toEqual({
      mensaje: 'Se cruza con la cita aceptada de las 10:00',
      refrescar: true,
    })
  })

  it('usa el primer mensaje de validación del arreglo', () => {
    expect(
      mensajeDeError(
        'servicioSinCita',
        new ErrorPeticion({
          status: 400,
          mensaje: 'montoCobrado must not be greater than 10000000',
          campos: ['montoCobrado must not be greater than 10000000'],
        }),
      ),
    ).toEqual({
      mensaje: 'montoCobrado must not be greater than 10000000',
      refrescar: false,
    })
  })
})
