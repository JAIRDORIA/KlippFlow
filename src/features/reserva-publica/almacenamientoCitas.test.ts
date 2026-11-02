import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CitaGuardada } from './types'
import {
  CLAVE_CITAS_CLIENTE,
  guardarCitaCliente,
  leerCitasGuardadas,
  obtenerCitaActivaDeCodigo,
  obtenerCitaGuardadaPorToken,
  olvidarCitaGuardada,
} from './almacenamientoCitas'

function cita(
  numero: number,
  codigo = 'BARB-0001',
  creadoEn = new Date(Date.UTC(2026, 9, 29, 12, numero)).toISOString(),
): CitaGuardada {
  return { token: `token-${numero}`, codigo, creadoEn }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('almacenamiento de citas del cliente', () => {
  it('guarda máximo 5 y deja la más reciente primero', () => {
    for (let indice = 1; indice <= 6; indice += 1) {
      guardarCitaCliente(cita(indice))
    }

    const citas = leerCitasGuardadas()
    expect(citas).toHaveLength(5)
    expect(citas[0]?.token).toBe('token-6')
    expect(citas[4]?.token).toBe('token-2')
  })

  it('no duplica tokens: actualiza la posición y la fecha', () => {
    guardarCitaCliente(cita(1, 'BARB-0001', '2026-10-29T12:00:00.000Z'))
    guardarCitaCliente(cita(2, 'BARB-0002', '2026-10-29T12:01:00.000Z'))
    guardarCitaCliente(cita(1, 'BARB-0001', '2026-10-29T12:02:00.000Z'))

    const citas = leerCitasGuardadas()
    expect(citas).toHaveLength(2)
    expect(citas.filter((actual) => actual.token === 'token-1')).toHaveLength(1)
    expect(citas[0]?.token).toBe('token-1')
  })

  it('tolera JSON corrupto y entradas inválidas', () => {
    window.localStorage.setItem(CLAVE_CITAS_CLIENTE, '{no-json')
    expect(leerCitasGuardadas()).toEqual([])

    window.localStorage.setItem(
      CLAVE_CITAS_CLIENTE,
      JSON.stringify([
        { token: '', codigo: 'BARB-0001', creadoEn: '2026-10-29T12:00:00.000Z' },
        { token: 'ok', codigo: 'BARB-0001', creadoEn: 'no-es-fecha' },
        cita(3),
        'basura',
      ]),
    )
    expect(leerCitasGuardadas()).toEqual([cita(3)])
  })

  it('encuentra la cita más reciente de un código sin distinguir mayúsculas', () => {
    guardarCitaCliente(cita(1, 'BARB-0001', '2026-10-29T12:00:00.000Z'))
    guardarCitaCliente(cita(2, 'BARB-0001', '2026-10-29T12:05:00.000Z'))
    guardarCitaCliente(cita(3, 'BARB-0002', '2026-10-29T12:09:00.000Z'))

    expect(obtenerCitaActivaDeCodigo('barb-0001')?.token).toBe('token-2')
    expect(obtenerCitaActivaDeCodigo('BARB-9999')).toBeNull()
  })

  it('encuentra una cita por token', () => {
    guardarCitaCliente(cita(4))
    expect(obtenerCitaGuardadaPorToken('token-4')).toEqual(cita(4))
    expect(obtenerCitaGuardadaPorToken('no-existe')).toBeNull()
  })

  it('no lanza si localStorage está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => guardarCitaCliente(cita(1))).not.toThrow()
    expect(leerCitasGuardadas()).toEqual([])
  })
})

describe('olvidarCitaGuardada', () => {
  it('borra solo la cita indicada', () => {
    guardarCitaCliente(cita(1))
    guardarCitaCliente(cita(2))

    olvidarCitaGuardada(cita(1).token)

    const restantes = leerCitasGuardadas()
    expect(restantes).toHaveLength(1)
    expect(restantes[0]?.token).toBe(cita(2).token)
  })

  it('no toca nada si el token no está', () => {
    guardarCitaCliente(cita(3))
    olvidarCitaGuardada('token-inexistente')
    expect(leerCitasGuardadas()).toHaveLength(1)
  })

  it('deja la lista vacía al borrar la última', () => {
    guardarCitaCliente(cita(4))
    olvidarCitaGuardada(cita(4).token)
    expect(leerCitasGuardadas()).toEqual([])
  })

  it('no lanza si localStorage está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => olvidarCitaGuardada('token')).not.toThrow()
  })
})
