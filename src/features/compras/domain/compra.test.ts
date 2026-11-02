import { describe, expect, it } from 'vitest'
import {
  DESCRIPCION_MAXIMA,
  caracteresRestantes,
  hayCambios,
  mostrarContadorDescripcion,
  validarCompra,
} from './compra'

describe('validarCompra', () => {
  it('acepta una compra válida y recorta la descripción', () => {
    const resultado = validarCompra({
      descripcion: '  TEST-Navajas  ',
      monto: '27.000',
    })

    expect(resultado).toEqual({
      valido: true,
      descripcion: 'TEST-Navajas',
      monto: 27000,
      errores: {},
    })
  })

  it('interpreta "$27.000", "27.000" y "27000" igual', () => {
    for (const monto of ['$27.000', '27.000', '27000']) {
      expect(validarCompra({ descripcion: 'TEST', monto }).monto).toBe(27000)
    }
  })

  it('acepta los límites 1 y 50.000.000', () => {
    expect(validarCompra({ descripcion: 'TEST', monto: '1' }).monto).toBe(1)
    expect(validarCompra({ descripcion: 'TEST', monto: '50.000.000' }).monto).toBe(
      50_000_000,
    )
  })

  it('rechaza 0, 50.000.001, negativos, decimales y letras', () => {
    expect(validarCompra({ descripcion: 'TEST', monto: '0' }).valido).toBe(false)
    expect(validarCompra({ descripcion: 'TEST', monto: '0' }).errores.monto).toContain(
      'mínimo',
    )

    expect(validarCompra({ descripcion: 'TEST', monto: '50.000.001' }).valido).toBe(false)
    expect(
      validarCompra({ descripcion: 'TEST', monto: '50.000.001' }).errores.monto,
    ).toContain('máximo')

    expect(validarCompra({ descripcion: 'TEST', monto: '-500' }).valido).toBe(false)
    expect(validarCompra({ descripcion: 'TEST', monto: '27,5' }).valido).toBe(false)
    expect(validarCompra({ descripcion: 'TEST', monto: '27.5' }).valido).toBe(false)
    expect(validarCompra({ descripcion: 'TEST', monto: 'abc' }).valido).toBe(false)
  })

  it('exige descripción', () => {
    const vacia = validarCompra({ descripcion: '', monto: '1000' })
    expect(vacia.valido).toBe(false)
    expect(vacia.errores.descripcion).toBe('Escribe qué compraste.')

    const soloEspacios = validarCompra({ descripcion: '    ', monto: '1000' })
    expect(soloEspacios.valido).toBe(false)
  })

  it('acepta 150 caracteres y rechaza 151', () => {
    const de150 = validarCompra({
      descripcion: 'a'.repeat(DESCRIPCION_MAXIMA),
      monto: '1000',
    })
    expect(de150.valido).toBe(true)

    const de151 = validarCompra({
      descripcion: 'a'.repeat(DESCRIPCION_MAXIMA + 1),
      monto: '1000',
    })
    expect(de151.valido).toBe(false)
    expect(de151.errores.descripcion).toContain('150')
  })

  it('exige monto', () => {
    const resultado = validarCompra({ descripcion: 'TEST', monto: '  ' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.monto).toBe('Escribe el monto de la compra.')
  })

  it('acumula los dos errores', () => {
    const resultado = validarCompra({ descripcion: ' ', monto: '0' })
    expect(resultado.errores.descripcion).toBeDefined()
    expect(resultado.errores.monto).toBeDefined()
  })
})

describe('contador de descripción', () => {
  it('aparece solo cuando faltan menos de 20 caracteres', () => {
    expect(mostrarContadorDescripcion('a'.repeat(130))).toBe(false)
    expect(mostrarContadorDescripcion('a'.repeat(131))).toBe(true)
    expect(mostrarContadorDescripcion('a'.repeat(151))).toBe(true)
  })

  it('calcula los caracteres restantes', () => {
    expect(caracteresRestantes('a'.repeat(150))).toBe(0)
    expect(caracteresRestantes('a'.repeat(151))).toBe(-1)
  })
})

describe('hayCambios', () => {
  it('detecta cambios en descripción o monto', () => {
    expect(
      hayCambios(
        { descripcion: 'TEST-Navajas', monto: 27000 },
        { descripcion: 'TEST-Navajas', monto: 27000 },
      ),
    ).toBe(false)

    expect(
      hayCambios(
        { descripcion: 'TEST-Navajas', monto: 27000 },
        { descripcion: 'TEST-Navajas nuevas', monto: 27000 },
      ),
    ).toBe(true)

    expect(
      hayCambios(
        { descripcion: 'TEST-Navajas', monto: 27000 },
        { descripcion: 'TEST-Navajas', monto: 30000 },
      ),
    ).toBe(true)
  })
})
