import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import { ErrorNotificaciones, mensajeDeErrorNotificaciones } from './errores'

function peticion(status: number, mensaje = ''): ErrorPeticion {
  return new ErrorPeticion({ status, mensaje })
}

function errorDeNavegador(nombre: string): Error {
  const error = new Error('fallo del navegador')
  error.name = nombre
  return error
}

describe('mensajeDeErrorNotificaciones', () => {
  it('traduce el permiso denegado', () => {
    const resultado = mensajeDeErrorNotificaciones(
      new ErrorNotificaciones('permiso-denegado'),
    )

    expect(resultado.estado).toBe('denegado')
    expect(resultado.mensaje).toContain('Bloqueaste')
  })

  it('traduce la falta de soporte', () => {
    const resultado = mensajeDeErrorNotificaciones(new ErrorNotificaciones('sin-soporte'))

    expect(resultado.estado).toBe('no_soportado')
    expect(resultado.mensaje).toContain('no permite notificaciones')
  })

  it('traduce un fallo de suscripción', () => {
    const resultado = mensajeDeErrorNotificaciones(new ErrorNotificaciones('suscripcion'))

    expect(resultado.estado).toBe('error')
    expect(resultado.mensaje).toContain('No pudimos activar')
  })

  it('traduce el 401 del backend', () => {
    const resultado = mensajeDeErrorNotificaciones(peticion(401))

    expect(resultado.estado).toBe('error')
    expect(resultado.mensaje).toContain('sesión')
  })

  it('usa el mensaje del 400', () => {
    expect(
      mensajeDeErrorNotificaciones(peticion(400, 'endpoint debe ser https')).mensaje,
    ).toBe('endpoint debe ser https')

    expect(mensajeDeErrorNotificaciones(peticion(400)).mensaje).toContain('Revisa')
  })

  it('traduce el 429', () => {
    expect(mensajeDeErrorNotificaciones(peticion(429)).mensaje).toContain(
      'Demasiados intentos',
    )
  })

  it('traduce el fallo de red', () => {
    expect(mensajeDeErrorNotificaciones(peticion(0)).mensaje).toContain('conectar')
  })

  it('traduce NotAllowedError del navegador', () => {
    const resultado = mensajeDeErrorNotificaciones(errorDeNavegador('NotAllowedError'))

    expect(resultado.estado).toBe('denegado')
  })

  it('traduce AbortError e InvalidStateError', () => {
    expect(mensajeDeErrorNotificaciones(errorDeNavegador('AbortError')).mensaje).toContain(
      'No pudimos activar',
    )
    expect(
      mensajeDeErrorNotificaciones(errorDeNavegador('InvalidStateError')).mensaje,
    ).toContain('No pudimos activar')
  })

  it('cae al mensaje genérico', () => {
    expect(mensajeDeErrorNotificaciones('cualquier cosa').mensaje).toBe(
      'Algo salió mal. Inténtalo de nuevo.',
    )
  })
})
