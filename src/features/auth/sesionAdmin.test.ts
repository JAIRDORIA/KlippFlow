import { beforeEach, describe, expect, it } from 'vitest'
import {
  CLAVE_SESION,
  CLAVE_SESION_ADMIN,
  EVENTO_SESION_CERRADA,
  type DetalleSesionCerrada,
} from '@/shared/api/almacenamientoSesion'
import { guardarSesion } from './sesion'
import {
  borrarSesionAdmin,
  cargarSesionAdmin,
  guardarSesionAdmin,
} from './sesionAdmin'
import type { Sesion } from './types'

/** JWT de mentira: solo importa el payload (`tipo`, `exp`), no la firma. */
function jwt(payload: Record<string, unknown>): string {
  const codificar = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar(payload)}.firma`
}

function enHoras(horas: number): number {
  return Math.floor(Date.now() / 1000) + horas * 3600
}

const ADMIN = {
  accessToken: jwt({ sub: 1, tipo: 'admin', username: 'admin_jair', exp: enHoras(2) }),
  id: 1,
  username: 'admin_jair',
  nombre: 'Jair',
}

function sesionBarberoPrueba(): Sesion {
  return {
    token: jwt({ sub: 7, tipo: 'barbero', username: 'ana.paz', exp: enHoras(2) }),
    tipo: 'barbero',
    usuario: {
      tipo: 'barbero',
      id: 7,
      codigoUnico: 'BARB-0007',
      nombres: 'Ana',
      apellidos: 'Paz',
      nombreBarberia: 'Ana Barber',
      username: 'ana.paz',
      estadoCuenta: 'activo',
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('sesión de administrador', () => {
  it('guarda y recupera la sesión', () => {
    guardarSesionAdmin(ADMIN)
    expect(cargarSesionAdmin()).toEqual(ADMIN)
  })

  it('usa una clave distinta de la del barbero', () => {
    guardarSesionAdmin(ADMIN)
    expect(window.localStorage.getItem(CLAVE_SESION_ADMIN)).not.toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('descarta un token de barbero guardado en la clave de admin', () => {
    const tokenBarbero = jwt({ sub: 7, tipo: 'barbero', exp: enHoras(2) })
    window.localStorage.setItem(
      CLAVE_SESION_ADMIN,
      JSON.stringify({ accessToken: tokenBarbero, id: 7, username: 'x', nombre: 'X' }),
    )

    expect(cargarSesionAdmin()).toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION_ADMIN)).toBeNull()
  })

  it('descarta un token vencido', () => {
    const vencido = jwt({ sub: 1, tipo: 'admin', exp: enHoras(-1) })
    window.localStorage.setItem(
      CLAVE_SESION_ADMIN,
      JSON.stringify({ accessToken: vencido, id: 1, username: 'a', nombre: 'A' }),
    )

    expect(cargarSesionAdmin()).toBeNull()
  })

  it('sobrevive a un JSON corrupto', () => {
    window.localStorage.setItem(CLAVE_SESION_ADMIN, '{roto')
    expect(cargarSesionAdmin()).toBeNull()
  })

  it('al borrar la sesión del admin no toca la del barbero', () => {
    guardarSesionAdmin(ADMIN)
    guardarSesion(sesionBarberoPrueba())

    borrarSesionAdmin('manual')

    expect(cargarSesionAdmin()).toBeNull()
    expect(window.localStorage.getItem(CLAVE_SESION)).not.toBeNull()
  })

  it('avisa del cierre con la zona admin', () => {
    let detalle: DetalleSesionCerrada | null = null
    const escuchar = (evento: Event) => {
      detalle = (evento as CustomEvent<DetalleSesionCerrada>).detail
    }

    window.addEventListener(EVENTO_SESION_CERRADA, escuchar)
    borrarSesionAdmin('expirada')
    window.removeEventListener(EVENTO_SESION_CERRADA, escuchar)

    expect(detalle).toEqual({ zona: 'admin', motivo: 'expirada' })
  })
})
