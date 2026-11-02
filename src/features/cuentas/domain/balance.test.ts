import { describe, expect, it } from 'vitest'
import { sumarDias } from '@/shared/lib/fechas'
import { clavesBalance } from '../claves'
import type { Balance } from '../types'
import {
  ALTO_MAXIMO_BARRA,
  ALTO_MINIMO_BARRA,
  calcularFilasBalance,
  construirBarras,
  construirDiasLista,
  esBalanceCoherente,
  historialTodoEnCero,
  textoAccesibilidadGrafico,
} from './balance'
import { fechaConsulta } from './dia'

function balance(fecha: string, gananciaNeta: number): Balance {
  return {
    fecha,
    totalAnticipos: 0,
    totalServicios: 0,
    totalPropinas: 0,
    totalDevoluciones: 0,
    totalCompras: 0,
    gananciaNeta,
  }
}

/** 30 días hacia atrás, del más reciente al más antiguo. */
function historialDe30(valor: (indice: number) => number, fin = '2026-10-30'): Balance[] {
  return Array.from({ length: 30 }, (_, indice) =>
    balance(sumarDias(fin, -indice), valor(indice)),
  )
}

describe('construirBarras', () => {
  it('invierte el historial a orden cronológico', () => {
    const barras = construirBarras(
      [balance('2026-10-30', 1000), balance('2026-10-29', 2000)],
      '2026-10-30',
    )
    expect(barras.map((barra) => barra.fecha)).toEqual(['2026-10-29', '2026-10-30'])
  })

  it('con 30 días en cero deja 30 marcas de 2 px y marca hoy por fecha', () => {
    const barras = construirBarras(historialDe30(() => 0), '2026-10-30')

    expect(barras).toHaveLength(30)
    expect(barras.every((barra) => barra.altura === ALTO_MINIMO_BARRA)).toBe(true)
    expect(barras.filter((barra) => barra.esHoy).map((barra) => barra.fecha)).toEqual([
      '2026-10-30',
    ])
  })

  it('con un solo día con valor lleva esa barra al alto máximo', () => {
    const historial = historialDe30((indice) => (indice === 0 ? 50000 : 0))
    const barras = construirBarras(historial, '2026-10-30')
    const ultima = barras[barras.length - 1]

    expect(ultima?.altura).toBe(ALTO_MAXIMO_BARRA)
    expect(barras.slice(0, -1).every((barra) => barra.altura === ALTO_MINIMO_BARRA)).toBe(
      true,
    )
  })

  it('proporciona la altura al mayor valor absoluto y marca negativas', () => {
    const barras = construirBarras(
      [balance('2026-10-30', -50_000_000), balance('2026-10-29', 25_000_000)],
      '2026-10-30',
    )

    expect(barras[0]?.altura).toBe(44)
    expect(barras[0]?.negativa).toBe(false)
    expect(barras[1]?.altura).toBe(ALTO_MAXIMO_BARRA)
    expect(barras[1]?.negativa).toBe(true)
  })

  it('funciona con todos los días negativos', () => {
    const barras = construirBarras(
      [balance('2026-10-30', -2000), balance('2026-10-29', -1000)],
      '2026-10-30',
    )

    expect(barras.every((barra) => barra.negativa)).toBe(true)
    expect(barras[0]?.altura).toBe(44)
    expect(barras[1]?.altura).toBe(ALTO_MAXIMO_BARRA)
  })

  it('marca hoy aunque su valor sea cero', () => {
    const barras = construirBarras(
      [balance('2026-10-30', 0), balance('2026-10-29', 5000)],
      '2026-10-30',
    )
    const hoy = barras.find((barra) => barra.esHoy)

    expect(hoy?.altura).toBe(ALTO_MINIMO_BARRA)
    expect(hoy?.valor).toBe(0)
    expect(barras[0]?.altura).toBe(ALTO_MAXIMO_BARRA)
  })

  it('ordena bien un cambio de año', () => {
    const barras = construirBarras(
      [balance('2027-01-01', 1000), balance('2026-12-31', 500)],
      '2027-01-01',
    )
    expect(barras.map((barra) => barra.fecha)).toEqual(['2026-12-31', '2027-01-01'])
    expect(barras[1]?.esHoy).toBe(true)
  })
})

describe('construirDiasLista', () => {
  const historial = [
    balance('2026-10-30', 5000),
    balance('2026-10-29', -1000),
    balance('2026-10-28', 0),
  ]

  it('excluye hoy por fecha y conserva el orden de la API', () => {
    expect(construirDiasLista(historial, '2026-10-30').map((dia) => dia.fecha)).toEqual([
      '2026-10-29',
      '2026-10-28',
    ])
  })

  it('formatea la fecha y asigna el tono del neto', () => {
    const dias = construirDiasLista(historial, '2026-10-30')

    expect(dias[0]).toEqual({
      fecha: '2026-10-29',
      etiqueta: 'Jue, 29 de oct',
      valor: -1000,
      tono: 'negativo',
    })
    expect(dias[1]).toMatchObject({ etiqueta: 'Mié, 28 de oct', tono: 'cero', valor: 0 })
  })

  it('no depende de la posición de hoy', () => {
    // Historial con hoy en medio: se filtra por fecha, no por índice.
    const desordenado = [
      balance('2026-10-30', 5000),
      balance('2026-10-29', 100),
      balance('2026-10-28', 200),
    ]
    expect(construirDiasLista(desordenado, '2026-10-30')).toHaveLength(2)
  })
})

describe('historialTodoEnCero', () => {
  it('detecta los 30 días en cero', () => {
    expect(historialTodoEnCero(historialDe30(() => 0))).toBe(true)
  })

  it('basta un día con movimiento', () => {
    expect(historialTodoEnCero(historialDe30((indice) => (indice === 5 ? 1 : 0)))).toBe(
      false,
    )
  })
})

describe('textoAccesibilidadGrafico', () => {
  it('resume rango, hoy, mejor y peor día', () => {
    const barras = construirBarras(
      [
        balance('2026-10-30', 12000),
        balance('2026-10-29', -2000),
        balance('2026-10-28', 80000),
      ],
      '2026-10-30',
    )
    const texto = textoAccesibilidadGrafico(barras)

    expect(texto).toContain(
      'Neto diario del miércoles 28 de octubre al viernes 30 de octubre',
    )
    expect(texto).toContain('Hoy: $12.000')
    expect(texto).toContain('Mejor día: Mié, 28 de oct con $80.000')
    expect(texto).toContain('Peor día: Jue, 29 de oct con -$2.000')
  })

  it('avisa cuando todo está en cero', () => {
    expect(textoAccesibilidadGrafico(construirBarras(historialDe30(() => 0), '2026-10-30')))
      .toContain('Todos los días están en cero')
  })

  it('maneja el historial vacío', () => {
    expect(textoAccesibilidadGrafico([])).toBe(
      'No hay datos del balance de los últimos 30 días.',
    )
  })
})

describe('calcularFilasBalance', () => {
  it('arma servicios, propinas y compras con sus signos', () => {
    const filas = calcularFilasBalance({
      ...balance('2026-10-30', 15000),
      totalServicios: 30000,
      totalPropinas: 5000,
      totalCompras: 20000,
    })

    expect(filas.map((fila) => fila.clave)).toEqual(['servicios', 'propinas', 'compras'])
    expect(filas[0]).toMatchObject({ valor: 30000, signo: '+', tono: 'positivo' })
    expect(filas[1]).toMatchObject({ valor: 5000, signo: '+', tono: 'positivo' })
    expect(filas[2]).toMatchObject({ valor: 20000, signo: '−', tono: 'negativo' })
  })

  it('en cero no muestra signo', () => {
    const filas = calcularFilasBalance(balance('2026-10-30', 0))

    expect(filas.every((fila) => fila.signo === '' && fila.tono === 'cero')).toBe(true)
  })

  it('acepta montos que llegan como texto', () => {
    const filas = calcularFilasBalance({
      ...balance('2026-10-30', 0),
      totalServicios: '30000',
      totalPropinas: '5000',
      totalCompras: '20000',
    })

    expect(filas[0]?.valor).toBe(30000)
    expect(filas[2]?.valor).toBe(20000)
  })
})

describe('esBalanceCoherente', () => {
  it('cuadra servicios + propinas − compras con gananciaNeta', () => {
    expect(
      esBalanceCoherente({
        ...balance('2026-10-30', 15000),
        totalServicios: 30000,
        totalPropinas: 5000,
        totalCompras: 20000,
      }),
    ).toBe(true)
  })

  it('detecta una ganancia que no cuadra', () => {
    expect(
      esBalanceCoherente({
        ...balance('2026-10-30', 1000),
        totalServicios: 30000,
        totalPropinas: 5000,
        totalCompras: 20000,
      }),
    ).toBe(false)
  })
})

describe('fechaConsulta y claves de consulta', () => {
  it('cambia la clave al pasar la medianoche de Bogotá', () => {
    const antes = fechaConsulta(new Date('2026-10-31T04:59:00Z'))
    const despues = fechaConsulta(new Date('2026-10-31T05:01:00Z'))

    expect(antes).toBe('2026-10-30')
    expect(despues).toBe('2026-10-31')
    expect(clavesBalance.hoy(antes)).not.toEqual(clavesBalance.hoy(despues))
    expect(clavesBalance.historial(antes)).not.toEqual(clavesBalance.historial(despues))
  })

  it('las claves cuelgan del prefijo barbero', () => {
    expect(clavesBalance.hoy('2026-10-30').slice(0, 1)).toEqual(['barbero'])
    expect(clavesBalance.historial('2026-10-30').slice(0, 1)).toEqual(['barbero'])
  })
})
