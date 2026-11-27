import { describe, expect, it } from 'vitest'
import {
  CLAVE_PESTANA_LOGIN,
  guardarPestana,
  pestanaInicial,
  type AlmacenPestana,
} from './pestanaLogin'

function almacenEnMemoria(inicial: Record<string, string> = {}): AlmacenPestana {
  const datos = new Map(Object.entries(inicial))
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor)
    },
  }
}

const almacenRoto: AlmacenPestana = {
  getItem: () => {
    throw new Error('bloqueado')
  },
  setItem: () => {
    throw new Error('bloqueado')
  },
}

describe('pestanaInicial', () => {
  it('abre en cliente si no hay nada guardado', () => {
    expect(pestanaInicial(null, almacenEnMemoria())).toBe('cliente')
  })

  it('recuerda la pestaña de barbero', () => {
    const almacen = almacenEnMemoria({ [CLAVE_PESTANA_LOGIN]: 'barbero' })
    expect(pestanaInicial(null, almacen)).toBe('barbero')
  })

  it('un destino de cliente abre en cliente', () => {
    const almacen = almacenEnMemoria({ [CLAVE_PESTANA_LOGIN]: 'barbero' })
    expect(pestanaInicial('/mi', almacen)).toBe('cliente')
    expect(pestanaInicial('/b/BARB-0001', almacen)).toBe('cliente')
    expect(pestanaInicial('/cita/token', almacen)).toBe('cliente')
  })

  it('el enlace profundo del panel abre en barbero', () => {
    const almacen = almacenEnMemoria({ [CLAVE_PESTANA_LOGIN]: 'cliente' })
    expect(pestanaInicial('/dashboard', almacen)).toBe('barbero')
    expect(pestanaInicial('/dashboard?origen=whatsapp', almacen)).toBe('barbero')
    expect(pestanaInicial('/app/hoy', almacen)).toBe('barbero')
    expect(pestanaInicial('/instalar', almacen)).toBe('barbero')
  })

  it('ignora valores desconocidos y almacenes que fallan', () => {
    const almacen = almacenEnMemoria({ [CLAVE_PESTANA_LOGIN]: 'admin' })
    expect(pestanaInicial(null, almacen)).toBe('cliente')
    expect(pestanaInicial(null, almacenRoto)).toBe('cliente')
    expect(pestanaInicial(null, null)).toBe('cliente')
  })
})

describe('guardarPestana', () => {
  it('guarda la pestaña elegida', () => {
    const almacen = almacenEnMemoria()
    guardarPestana('barbero', almacen)
    expect(almacen.getItem(CLAVE_PESTANA_LOGIN)).toBe('barbero')
  })

  it('no lanza si el almacenamiento falla', () => {
    expect(() => guardarPestana('barbero', almacenRoto)).not.toThrow()
    expect(() => guardarPestana('barbero', null)).not.toThrow()
  })
})
