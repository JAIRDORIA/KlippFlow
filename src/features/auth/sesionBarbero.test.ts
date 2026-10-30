import { beforeEach, describe, expect, it } from 'vitest'
import { CLAVE_SESION_BARBERO } from '@/shared/api/almacenamientoSesion'
import {
  cargarSesionBarbero,
  guardarSesionBarbero,
  leerPayloadJwt,
  tokenVigente,
} from './sesionBarbero'

const AHORA = Date.UTC(2026, 9, 29, 15, 0, 0)

function crearToken(payload: Record<string, unknown>): string {
  const base64 = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${base64}.firma-simulada`
}

function tokenBarbero(expSegundos: number): string {
  return crearToken({ sub: 1, tipo: 'barbero', username: 'barbero1', exp: expSegundos })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('leerPayloadJwt', () => {
  it('lee solo los datos necesarios y tolera basura', () => {
    const token = crearToken({
      sub: 7,
      tipo: 'barbero',
      username: 'ana',
      exp: 1_800_000_000,
    })
    expect(leerPayloadJwt(token)).toEqual({
      sub: 7,
      tipo: 'barbero',
      username: 'ana',
      exp: 1_800_000_000,
    })
    expect(leerPayloadJwt('no-es-un-jwt')).toBeNull()
    expect(leerPayloadJwt('a.%%%.c')).toBeNull()
  })
})

describe('tokenVigente', () => {
  it('exige el tipo correcto y exp futuro', () => {
    const futuro = Math.floor(AHORA / 1000) + 3600
    expect(tokenVigente(tokenBarbero(futuro), 'barbero', AHORA)).toBe(true)
    expect(tokenVigente(tokenBarbero(futuro), 'admin', AHORA)).toBe(false)
    expect(tokenVigente(tokenBarbero(futuro), 'cliente', AHORA)).toBe(false)
  })

  it('rechaza tokens vencidos o sin exp', () => {
    const pasado = Math.floor(AHORA / 1000) - 1
    expect(tokenVigente(tokenBarbero(pasado), 'barbero', AHORA)).toBe(false)
    expect(
      tokenVigente(crearToken({ tipo: 'barbero' }), 'barbero', AHORA),
    ).toBe(false)
  })
})

describe('cargarSesionBarbero', () => {
  it('recupera una sesión de barbero vigente', () => {
    const exp = Math.floor(AHORA / 1000) + 3600
    const accessToken = tokenBarbero(exp)
    guardarSesionBarbero({
      accessToken,
      nombre: 'Barbero Prueba',
      username: 'barbero1',
      nombreBarberia: 'Barbería Demo',
    })

    expect(cargarSesionBarbero(AHORA)).toEqual({
      accessToken,
      nombre: 'Barbero Prueba',
      username: 'barbero1',
      nombreBarberia: 'Barbería Demo',
    })
  })

  it('no abre /app con un token de admin guardado en la clave del barbero', () => {
    const exp = Math.floor(AHORA / 1000) + 3600
    const tokenAdmin = crearToken({ sub: 1, tipo: 'admin', username: 'admin', exp })
    window.localStorage.setItem(
      CLAVE_SESION_BARBERO,
      JSON.stringify({ accessToken: tokenAdmin, nombre: 'Admin' }),
    )

    expect(cargarSesionBarbero(AHORA)).toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION_BARBERO)).toBeNull()
  })

  it('descarta un token vencido', () => {
    const exp = Math.floor(AHORA / 1000) - 60
    window.localStorage.setItem(
      CLAVE_SESION_BARBERO,
      JSON.stringify({ accessToken: tokenBarbero(exp), nombre: 'Barbero' }),
    )

    expect(cargarSesionBarbero(AHORA)).toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION_BARBERO)).toBeNull()
  })

  it('devuelve null si el token se borró a mano', () => {
    expect(cargarSesionBarbero(AHORA)).toBeNull()
  })

  it('tolera JSON corrupto', () => {
    window.localStorage.setItem(CLAVE_SESION_BARBERO, '{no-json')
    expect(cargarSesionBarbero(AHORA)).toBeNull()
  })
})
