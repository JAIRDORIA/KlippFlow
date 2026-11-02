import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import {
  EFECTO_ESTADO,
  ETIQUETA_ESTADO,
  OPCIONES_ESTADO,
  VARIANTE_ESTADO,
  esEstadoValido,
} from './estado'
import {
  mensajeDeErrorAdmin,
  mensajeDeErrorLoginAdmin,
  textoDeErrorAdmin,
} from './errores'

function peticion(status: number, mensaje = '', campos?: string[]): ErrorPeticion {
  return new ErrorPeticion({ status, mensaje, campos })
}

describe('estados del barbero', () => {
  it('tiene etiqueta, color y efecto para los tres estados', () => {
    expect(ETIQUETA_ESTADO).toEqual({
      activo: 'Activo',
      suspendido: 'Suspendido',
      vencido: 'Vencido',
    })
    expect(VARIANTE_ESTADO).toEqual({
      activo: 'verde',
      suspendido: 'ambar',
      vencido: 'rojo',
    })
    expect(EFECTO_ESTADO.activo).toContain('Podrá iniciar sesión')
    expect(EFECTO_ESTADO.suspendido).toContain('No podrá iniciar sesión')
    expect(EFECTO_ESTADO.vencido).toContain('No podrá iniciar sesión')
  })

  it('ofrece las tres opciones en orden', () => {
    expect(OPCIONES_ESTADO.map((opcion) => opcion.valor)).toEqual([
      'activo',
      'suspendido',
      'vencido',
    ])
  })

  it('reconoce solo los valores válidos', () => {
    expect(esEstadoValido('activo')).toBe(true)
    expect(esEstadoValido('suspendido')).toBe(true)
    expect(esEstadoValido('vencido')).toBe(true)
    expect(esEstadoValido('bloqueado')).toBe(false)
    expect(esEstadoValido('')).toBe(false)
  })
})

describe('mensajeDeErrorAdmin', () => {
  it('marca el 401 como sesión vencida', () => {
    expect(mensajeDeErrorAdmin(peticion(401, ''))).toEqual({
      mensaje: 'Sesión de administrador vencida. Vuelve a entrar.',
      sesionVencida: true,
    })
    expect(mensajeDeErrorAdmin(peticion(401, 'Unauthorized')).mensaje).toContain(
      'Sesión de administrador',
    )
  })

  it('usa el mensaje del 403', () => {
    expect(mensajeDeErrorAdmin(peticion(403, 'Rol insuficiente'))).toEqual({
      mensaje: 'Rol insuficiente',
      sesionVencida: false,
    })
    expect(mensajeDeErrorAdmin(peticion(403, '')).mensaje).toContain('permiso')
  })

  it('usa el mensaje del 400 o el primer campo', () => {
    expect(mensajeDeErrorAdmin(peticion(400, 'username must be a string')).mensaje).toBe(
      'username must be a string',
    )
    expect(mensajeDeErrorAdmin(peticion(400, '', ['correo debe ser email'])).mensaje).toBe(
      'correo debe ser email',
    )
    expect(mensajeDeErrorAdmin(peticion(400, '')).mensaje).toContain('Revisa')
  })

  it('traduce el 404', () => {
    expect(mensajeDeErrorAdmin(peticion(404, '')).mensaje).toBe('Ese barbero ya no existe.')
    expect(mensajeDeErrorAdmin(peticion(404, 'Barbero no encontrado')).mensaje).toBe(
      'Barbero no encontrado',
    )
  })

  it('traduce el 409 de usuario o correo repetido', () => {
    expect(mensajeDeErrorAdmin(peticion(409, 'El username ya está en uso')).mensaje).toBe(
      'Ese usuario o correo ya existe.',
    )
    expect(mensajeDeErrorAdmin(peticion(409, '')).mensaje).toBe(
      'Ese usuario o correo ya existe.',
    )
  })

  it('deja pasar el 409 de código único', () => {
    expect(
      mensajeDeErrorAdmin(peticion(409, 'No se pudo generar un código único')).mensaje,
    ).toContain('código')
  })

  it('traduce el 429', () => {
    expect(mensajeDeErrorAdmin(peticion(429, '')).mensaje).toContain('Demasiados intentos')
  })

  it('traduce el fallo de red', () => {
    expect(mensajeDeErrorAdmin(peticion(0, '')).mensaje).toContain('conectar')
  })

  it('cae al mensaje genérico', () => {
    expect(mensajeDeErrorAdmin(new Error('boom')).mensaje).toBe(
      'Algo salió mal. Inténtalo de nuevo.',
    )
    expect(textoDeErrorAdmin(peticion(429, ''))).toContain('Demasiados intentos')
  })
})

describe('mensajeDeErrorLoginAdmin', () => {
  it('trata el 401 del login como credenciales incorrectas', () => {
    expect(
      mensajeDeErrorLoginAdmin(peticion(401, 'Usuario o contraseña incorrectos')),
    ).toBe('Usuario o contraseña incorrectos')
    expect(mensajeDeErrorLoginAdmin(peticion(401, ''))).toBe(
      'Usuario o contraseña incorrectos',
    )
  })

  it('explica el 403 de admin inactivo', () => {
    expect(mensajeDeErrorLoginAdmin(peticion(403, ''))).toContain('no está activa')
    expect(mensajeDeErrorLoginAdmin(peticion(403, 'Cuenta suspendida'))).toBe(
      'Cuenta suspendida',
    )
  })

  it('traduce 400, 429, red y desconocidos', () => {
    expect(mensajeDeErrorLoginAdmin(peticion(400, 'password too short'))).toBe(
      'password too short',
    )
    expect(mensajeDeErrorLoginAdmin(peticion(429, ''))).toContain('Demasiados intentos')
    expect(mensajeDeErrorLoginAdmin(peticion(0, ''))).toContain('conectar')
    expect(mensajeDeErrorLoginAdmin('otra cosa')).toBe(
      'Algo salió mal. Inténtalo de nuevo.',
    )
  })
})
