import { describe, expect, it } from 'vitest'
import type { BarberoAdmin } from '../types'
import {
  coincideBusqueda,
  nombreCompleto,
  normalizarBusqueda,
  normalizarUsuario,
} from './texto'

function barbero(parcial: Partial<BarberoAdmin>): BarberoAdmin {
  return {
    id: 1,
    codigoUnico: 'K7M2P9QX',
    nombres: 'Ana',
    apellidos: 'Paz',
    nombreBarberia: 'Ana Barber',
    username: 'ana.paz',
    correo: 'ana@example.com',
    estadoCuenta: 'activo',
    linkReservas: 'https://app.test/b/K7M2P9QX',
    ...parcial,
  }
}

describe('normalizarBusqueda', () => {
  it('pasa a minúsculas y quita acentos y diéresis', () => {
    expect(normalizarBusqueda('José')).toBe('jose')
    expect(normalizarBusqueda('MUÑOZ')).toBe('munoz')
    expect(normalizarBusqueda('Güell')).toBe('guell')
  })

  it('recorta y colapsa espacios', () => {
    expect(normalizarBusqueda('  Ana   Barber  ')).toBe('ana barber')
    expect(normalizarBusqueda('   ')).toBe('')
  })
})

describe('normalizarUsuario', () => {
  it('recorta y baja a minúsculas', () => {
    expect(normalizarUsuario('  Ana.Paz  ')).toBe('ana.paz')
  })

  it('no quita los caracteres permitidos', () => {
    expect(normalizarUsuario('ana_paz-2.x')).toBe('ana_paz-2.x')
  })
})

describe('nombreCompleto', () => {
  it('une nombre y apellidos sin espacios sobrantes', () => {
    expect(nombreCompleto({ nombres: 'Ana', apellidos: 'Paz' })).toBe('Ana Paz')
    expect(nombreCompleto({ nombres: 'Ana', apellidos: '' })).toBe('Ana')
  })
})

describe('coincideBusqueda', () => {
  it('sin consulta coincide con todo', () => {
    expect(coincideBusqueda(barbero({}), '')).toBe(true)
    expect(coincideBusqueda(barbero({}), '   ')).toBe(true)
  })

  it('busca por nombre, apellidos, barbería y usuario', () => {
    expect(coincideBusqueda(barbero({}), 'ana')).toBe(true)
    expect(coincideBusqueda(barbero({}), 'paz')).toBe(true)
    expect(coincideBusqueda(barbero({}), 'barber')).toBe(true)
    expect(coincideBusqueda(barbero({}), 'ana.paz')).toBe(true)
  })

  it('encuentra acentos y eñes escribiendo sin ellos y al revés', () => {
    const conAcentos = barbero({
      nombres: 'Núñez',
      apellidos: 'Muñoz',
      nombreBarberia: 'Barbería Ñandú',
    })

    expect(coincideBusqueda(conAcentos, 'nunez')).toBe(true)
    expect(coincideBusqueda(conAcentos, 'muñoz')).toBe(true)
    expect(coincideBusqueda(conAcentos, 'NANDÚ')).toBe(true)
  })

  it('no coincide cuando no hay relación', () => {
    expect(coincideBusqueda(barbero({}), 'zzz')).toBe(false)
  })

  it('tolera barbería nula', () => {
    const sinBarberia = barbero({ nombreBarberia: null })
    expect(coincideBusqueda(sinBarberia, 'ana')).toBe(true)
    expect(coincideBusqueda(sinBarberia, 'barber')).toBe(false)
  })
})
