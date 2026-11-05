import { describe, expect, it } from 'vitest'
import {
  CLAVE_DESCARTE_CREACION,
  CLAVE_MARCA_PASSKEY,
  DIAS_DESCARTE_CREACION,
  borrarMarcaPasskey,
  descarteCreacionVigente,
  guardarDescarteCreacion,
  guardarMarcaPasskey,
  leerMarcaPasskey,
  type AlmacenPasskey,
} from './marca'

function almacen(initial: Record<string, string> = {}): AlmacenPasskey & {
  datos: Record<string, string>
} {
  const datos = { ...initial }
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor
    },
    removeItem: (clave) => {
      delete datos[clave]
    },
  }
}

const AHORA = new Date('2026-11-05T12:00:00.000Z')

describe('marca kf_passkey', () => {
  it('guarda, lee y borra la marca', () => {
    const guardado = almacen()

    expect(leerMarcaPasskey(guardado)).toBe(false)
    guardarMarcaPasskey(guardado)
    expect(guardado.datos[CLAVE_MARCA_PASSKEY]).toBe('1')
    expect(leerMarcaPasskey(guardado)).toBe(true)

    borrarMarcaPasskey(guardado)
    expect(leerMarcaPasskey(guardado)).toBe(false)
  })

  it('no falla si el almacenamiento no existe o lanza', () => {
    expect(leerMarcaPasskey(null)).toBe(false)
    expect(() => guardarMarcaPasskey(null)).not.toThrow()
    expect(() => borrarMarcaPasskey(null)).not.toThrow()

    const roto: AlmacenPasskey = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('lleno')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    }

    expect(leerMarcaPasskey(roto)).toBe(false)
    expect(() => guardarMarcaPasskey(roto)).not.toThrow()
    expect(() => borrarMarcaPasskey(roto)).not.toThrow()
  })
})

describe('descarte de la oferta de creación', () => {
  it('oculta la oferta 30 días y la vuelve a mostrar después', () => {
    const guardado = almacen()
    guardarDescarteCreacion(guardado, new Date('2026-10-20T12:00:00.000Z'))

    expect(descarteCreacionVigente(guardado, AHORA)).toBe(true)
    expect(
      descarteCreacionVigente(
        guardado,
        new Date(
          AHORA.getTime() + DIAS_DESCARTE_CREACION * 24 * 60 * 60 * 1000,
        ),
      ),
    ).toBe(false)
  })

  it('tolera datos corruptos y fechas futuras', () => {
    expect(
      descarteCreacionVigente(
        almacen({ [CLAVE_DESCARTE_CREACION]: '{roto' }),
        AHORA,
      ),
    ).toBe(false)
    expect(
      descarteCreacionVigente(
        almacen({
          [CLAVE_DESCARTE_CREACION]: JSON.stringify({
            descartadoEn: '2026-11-06T12:00:00.000Z',
          }),
        }),
        AHORA,
      ),
    ).toBe(false)
  })
})
