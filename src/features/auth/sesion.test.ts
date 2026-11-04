import { beforeEach, describe, expect, it } from 'vitest'
import {
  CLAVE_SESION,
  EVENTO_SESION_CERRADA,
  type DetalleSesionCerrada,
} from '@/shared/api/almacenamientoSesion'
import {
  actualizarPerfilEnSesion,
  borrarSesion,
  cargarSesion,
  guardarSesion,
  leerPayloadJwt,
  sesionDesdeRespuesta,
  tokenVigente,
} from './sesion'
import type {
  RespuestaLoginBarbero,
  RespuestaLoginCliente,
  Sesion,
} from './types'

const AHORA = Date.UTC(2026, 10, 4, 15, 0, 0)

function crearToken(payload: Record<string, unknown>): string {
  const base64 = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${base64}.firma-simulada`
}

function tokenBarbero(expSegundos: number): string {
  return crearToken({
    sub: 1,
    tipo: 'barbero',
    username: 'barbero1',
    exp: expSegundos,
  })
}

function tokenCliente(expSegundos: number): string {
  return crearToken({
    sub: 2,
    tipo: 'cliente',
    username: 'cliente.uno',
    exp: expSegundos,
  })
}

const futuro = Math.floor(AHORA / 1000) + 3600

function sesionBarbero(token = tokenBarbero(futuro)): Sesion {
  return {
    token,
    tipo: 'barbero',
    usuario: {
      tipo: 'barbero',
      id: 1,
      codigoUnico: 'BARB-0001',
      nombres: 'Barbero',
      apellidos: 'Prueba',
      nombreBarberia: 'Barbería Demo',
      username: 'barbero1',
      estadoCuenta: 'activo',
    },
  }
}

function sesionCliente(token = tokenCliente(futuro)): Sesion {
  return {
    token,
    tipo: 'cliente',
    usuario: {
      tipo: 'cliente',
      id: 2,
      nombre: 'Cliente',
      username: 'cliente.uno',
      correo: 'cliente@example.com',
      celular: '3001112233',
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('leerPayloadJwt y tokenVigente', () => {
  it('lee solo los datos necesarios y exige tipo y exp', () => {
    expect(leerPayloadJwt(tokenBarbero(futuro))).toEqual({
      sub: 1,
      tipo: 'barbero',
      username: 'barbero1',
      exp: futuro,
    })
    expect(tokenVigente(tokenBarbero(futuro), 'barbero', AHORA)).toBe(true)
    expect(tokenVigente(tokenBarbero(futuro), 'cliente', AHORA)).toBe(false)
    expect(tokenVigente(tokenBarbero(futuro - 7200), 'barbero', AHORA)).toBe(false)
    expect(leerPayloadJwt('no-es-un-jwt')).toBeNull()
  })
})

describe('guardar y cargar la sesión unificada', () => {
  it('guarda solo { token, tipo, usuario } y no datos sensibles', () => {
    guardarSesion(sesionCliente())

    const crudo = window.localStorage.getItem(CLAVE_SESION)
    expect(crudo).not.toBeNull()
    const guardado: unknown = JSON.parse(crudo ?? '{}')
    expect(Object.keys(guardado as Record<string, unknown>).sort()).toEqual([
      'tipo',
      'token',
      'usuario',
    ])
    expect(crudo).not.toContain('contrasena')
    expect(crudo).not.toContain('password')
    expect(crudo).not.toContain('registroToken')
    expect(crudo).not.toContain('perfil')
  })

  it('recupera barbero y cliente vigentes', () => {
    guardarSesion(sesionBarbero())
    expect(cargarSesion(AHORA)).toEqual(sesionBarbero())

    guardarSesion(sesionCliente())
    expect(cargarSesion(AHORA)).toEqual(sesionCliente())
  })

  it('descarta tokens vencidos, tipos cruzados y basura', () => {
    guardarSesion(sesionBarbero(tokenBarbero(futuro - 7200)))
    expect(cargarSesion(AHORA)).toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()

    window.localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: tokenCliente(futuro), tipo: 'admin' }),
    )
    expect(cargarSesion(AHORA)).toBeNull()

    window.localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        ...sesionCliente(),
        tipo: 'barbero',
      }),
    )
    expect(cargarSesion(AHORA)).toBeNull()

    window.localStorage.setItem(CLAVE_SESION, '{no-json')
    expect(cargarSesion(AHORA)).toBeNull()
  })

  it('borra la ranura y avisa la zona', () => {
    const eventos: DetalleSesionCerrada[] = []
    const escucha = (evento: Event) => {
      eventos.push((evento as CustomEvent<DetalleSesionCerrada>).detail)
    }
    window.addEventListener(EVENTO_SESION_CERRADA, escucha)

    guardarSesion(sesionCliente())
    borrarSesion('cliente', 'expirada')

    window.removeEventListener(EVENTO_SESION_CERRADA, escucha)
    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
    expect(eventos).toEqual([{ zona: 'cliente', motivo: 'expirada' }])
  })
})

describe('sesionDesdeRespuesta', () => {
  it('convierte la respuesta de barbero y de cliente', () => {
    const respuestaBarbero: RespuestaLoginBarbero = {
      accessToken: tokenBarbero(futuro),
      tipo: 'barbero',
      barbero: {
        id: 1,
        codigoUnico: 'BARB-0001',
        nombres: 'Barbero',
        apellidos: 'Prueba',
        nombreBarberia: 'Barbería Demo',
        username: 'barbero1',
        estadoCuenta: 'activo',
      },
    }
    expect(sesionDesdeRespuesta(respuestaBarbero)).toEqual(sesionBarbero())

    const respuestaCliente: RespuestaLoginCliente = {
      accessToken: tokenCliente(futuro),
      tipo: 'cliente',
      cliente: {
        id: 2,
        nombre: 'Cliente',
        username: 'cliente.uno',
        correo: 'cliente@example.com',
        celular: '3001112233',
      },
    }
    expect(sesionDesdeRespuesta(respuestaCliente)).toEqual(sesionCliente())
  })

  it('actualiza el perfil del cliente sin cambiar el token', () => {
    const original = sesionCliente()
    const actualizada = actualizarPerfilEnSesion(original, {
      id: 2,
      nombre: 'Cliente Nuevo',
      username: 'cliente.uno',
      correo: 'cliente@example.com',
      celular: '3001112244',
    })

    expect(actualizada.token).toBe(original.token)
    expect(actualizada.usuario).toMatchObject({
      nombre: 'Cliente Nuevo',
      celular: '3001112244',
    })
  })
})
