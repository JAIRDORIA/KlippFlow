import { describe, expect, it } from 'vitest'
import type { AlmacenDescarte } from '@/features/notificaciones/domain/onboarding'
import {
  DIAS_DESCARTE_AVISO,
  claveAvisoApp,
  descarteAvisoVigente,
  guardarDescarteAviso,
} from './avisoApp'

function almacen(initial: Record<string, string> = {}): AlmacenDescarte & {
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

describe('descarte del aviso de app', () => {
  it('usa una clave por cliente', () => {
    expect(claveAvisoApp(2)).not.toBe(claveAvisoApp(3))
  })

  it('oculta el aviso durante 7 días y lo vuelve a mostrar después', () => {
    const guardado = almacen()
    guardarDescarteAviso(2, guardado, new Date('2026-10-30T12:00:00.000Z'))

    expect(descarteAvisoVigente(2, guardado, AHORA)).toBe(true)
    expect(
      descarteAvisoVigente(
        2,
        guardado,
        new Date(AHORA.getTime() + DIAS_DESCARTE_AVISO * 24 * 60 * 60 * 1000),
      ),
    ).toBe(false)
    expect(descarteAvisoVigente(3, guardado, AHORA)).toBe(false)
  })

  it('tolera datos corruptos y almacenamiento que falla', () => {
    const corrupto = almacen({ [claveAvisoApp(2)]: '{roto' })
    expect(descarteAvisoVigente(2, corrupto, AHORA)).toBe(false)

    const roto: AlmacenDescarte = {
      getItem: () => null,
      setItem: () => {
        throw new Error('lleno')
      },
      removeItem: () => undefined,
    }

    expect(() => guardarDescarteAviso(2, roto, AHORA)).not.toThrow()
    expect(descarteAvisoVigente(2, null, AHORA)).toBe(false)
  })

  it('ignora una fecha futura', () => {
    const guardado = almacen({
      [claveAvisoApp(2)]: JSON.stringify({
        descartadoEn: '2026-11-06T12:00:00.000Z',
      }),
    })
    expect(descarteAvisoVigente(2, guardado, AHORA)).toBe(false)
  })
})
