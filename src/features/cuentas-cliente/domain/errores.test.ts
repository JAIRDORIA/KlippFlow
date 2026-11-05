import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import {
  mapearErrorCompletarCuenta,
  mapearErrorContrasena,
  mapearErrorCreacionCliente,
  mapearErrorGoogle,
  mapearErrorLogin,
  mapearErrorPerfil,
} from './errores'

function error(status: number, mensaje = 'x', campos?: string[]) {
  return new ErrorPeticion({ status, mensaje, campos })
}

describe('mapearErrorLogin', () => {
  it('traduce 401, 403 y 429', () => {
    expect(mapearErrorLogin(error(401))).toBe('Usuario o contraseña incorrectos')
    expect(mapearErrorLogin(error(403))).toBe(
      'Tu cuenta no está activa. Habla con el administrador de KlippFlow.',
    )
    expect(mapearErrorLogin(error(429))).toBe(
      'Demasiados intentos, espera un momento',
    )
    expect(
      mapearErrorLogin(error(409, 'Ese usuario ya está en uso')),
    ).toBe('Ese usuario ya está en uso')
  })

  it('deja pasar 400 y usa genérico para el resto', () => {
    expect(mapearErrorLogin(error(400, 'Datos inválidos'))).toBe('Datos inválidos')
    expect(mapearErrorLogin(error(500, 'boom'))).toBe(
      'Algo salió mal. Inténtalo de nuevo.',
    )
    expect(mapearErrorLogin(new Error('otro'))).toBe(
      'Algo salió mal. Inténtalo de nuevo.',
    )
  })
})

describe('mapearErrorGoogle', () => {
  it('traduce 503 a Google no disponible', () => {
    expect(mapearErrorGoogle(error(503))).toBe('Inicio con Google no disponible')
    expect(mapearErrorGoogle(error(429))).toBe(
      'Demasiados intentos, espera un momento',
    )
    expect(mapearErrorGoogle(error(401, 'Token de Google inválido'))).toBe(
      'Token de Google inválido',
    )
    expect(
      mapearErrorGoogle(error(409, 'Ya existe una cuenta para este Google')),
    ).toBe('Ya existe una cuenta para este Google')
  })
})

describe('mapearErrorCompletarCuenta', () => {
  it('distingue usuario tomado e identidad Google ya registrada', () => {
    expect(
      mapearErrorCompletarCuenta(error(409, 'Ese usuario ya está en uso')),
    ).toBe('Ese usuario ya está en uso')
    expect(
      mapearErrorCompletarCuenta(error(409, 'Ya existe una cuenta para este Google')),
    ).toBe('Ya existe una cuenta para este Google')
  })

  it('pide reiniciar Google con 401', () => {
    expect(mapearErrorCompletarCuenta(error(401))).toBe(
      'Vuelve a continuar con Google',
    )
  })
})

describe('mapearErrorCreacionCliente', () => {
  it('mapea 409 de solicitud pendiente', () => {
    expect(
      mapearErrorCreacionCliente(error(409, 'Ya tienes una solicitud pendiente')),
    ).toEqual({
      mensaje:
        'Ya tienes una solicitud pendiente. Espera la respuesta del barbero.',
      recargarHorarios: false,
      descartarHora: false,
    })
  })

  it('mapea 409 de horario y recarga', () => {
    expect(
      mapearErrorCreacionCliente(error(409, 'Ese horario ya no está disponible')),
    ).toEqual({
      mensaje: 'Ese horario ya no está disponible. Elige otro.',
      recargarHorarios: true,
      descartarHora: true,
    })
  })

  it('mapea barbero no activo, 404 y 429', () => {
    expect(
      mapearErrorCreacionCliente(error(409, 'El barbero no está activo')).mensaje,
    ).toBe('Las reservas no están disponibles por ahora.')
    expect(mapearErrorCreacionCliente(error(404)).mensaje).toBe(
      'No encontramos esta barbería.',
    )
    expect(mapearErrorCreacionCliente(error(429)).mensaje).toBe(
      'Demasiados intentos. Intenta de nuevo en unos minutos.',
    )
  })
})

describe('mapearErrorContrasena y mapearErrorPerfil', () => {
  it('un 400 de contraseña muestra el mensaje de la API', () => {
    expect(
      mapearErrorContrasena(
        error(400, 'Debes enviar tu contraseña actual para cambiarla'),
      ),
    ).toBe('Debes enviar tu contraseña actual para cambiarla')
    expect(mapearErrorContrasena(error(429))).toBe(
      'Demasiados intentos, espera un momento',
    )
  })

  it('perfil muestra el error de validación del backend', () => {
    expect(mapearErrorPerfil(error(400, 'Celular inválido'))).toBe(
      'Celular inválido',
    )
    expect(mapearErrorPerfil(error(400, 'x', ['Campo inválido']))).toBe(
      'Campo inválido',
    )
  })
})
