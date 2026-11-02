import { fechaCorta, fechaLarga } from '@/shared/lib/fechas'
import { formatearPesos } from '@/shared/lib/format'
import type { Balance, MontoApi } from '../types'

/**
 * Lógica pura de la pantalla Cuentas.
 *
 * Fuente: `docs/backend/COMPRAS_Y_BALANCE.md`.
 * Regla de la Fase 1: `ganancia_neta = total_servicios + total_propinas −
 * total_compras`. `total_anticipos` y `total_devoluciones` existen pero valen 0
 * y no se muestran.
 */

export const ALTO_MAXIMO_BARRA = 88
export const ALTO_MINIMO_BARRA = 2

/** Convierte un monto de la API (número o texto) a entero seguro. */
export function aEnteroMonto(valor: MontoApi | null | undefined): number {
  if (valor === null || valor === undefined) return 0
  const numero = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(numero)) return 0
  return Math.trunc(numero)
}

export interface BarraGrafico {
  fecha: string
  valor: number
  altura: number
  negativa: boolean
  esHoy: boolean
}

/**
 * Convierte el historial (más reciente → más antiguo) en 30 barras
 * cronológicas (más antiguo → hoy). La altura es proporcional al mayor valor
 * absoluto; el mínimo son 2 px y los días en cero son una marca de 2 px.
 */
export function construirBarras(
  historial: readonly Balance[],
  fechaHoy: string,
): BarraGrafico[] {
  const cronologico = [...historial].reverse()
  const valores = cronologico.map((dia) => aEnteroMonto(dia.gananciaNeta))
  const mayorAbsoluto = valores.reduce(
    (mayor, valor) => Math.max(mayor, Math.abs(valor)),
    0,
  )

  return cronologico.map((dia, indice) => {
    const valor = valores[indice] ?? 0
    const altura =
      mayorAbsoluto === 0 || valor === 0
        ? ALTO_MINIMO_BARRA
        : Math.max(
            ALTO_MINIMO_BARRA,
            Math.round((Math.abs(valor) / mayorAbsoluto) * ALTO_MAXIMO_BARRA),
          )

    return {
      fecha: dia.fecha,
      valor,
      altura,
      negativa: valor < 0,
      esHoy: dia.fecha === fechaHoy,
    }
  })
}

export type TonoNeto = 'positivo' | 'negativo' | 'cero'

export interface DiaLista {
  fecha: string
  etiqueta: string
  valor: number
  tono: TonoNeto
}

/** Días anteriores a hoy, con el orden que entrega la API (reciente primero). */
export function construirDiasLista(
  historial: readonly Balance[],
  fechaHoy: string,
): DiaLista[] {
  return historial
    .filter((dia) => dia.fecha !== fechaHoy)
    .map((dia) => {
      const valor = aEnteroMonto(dia.gananciaNeta)
      return {
        fecha: dia.fecha,
        etiqueta: fechaCorta(dia.fecha),
        valor,
        tono: valor < 0 ? 'negativo' : valor === 0 ? 'cero' : 'positivo',
      }
    })
}

export function historialTodoEnCero(historial: readonly Balance[]): boolean {
  return historial.every((dia) => aEnteroMonto(dia.gananciaNeta) === 0)
}

/** Texto que se expone en el `aria-label` del gráfico. */
export function textoAccesibilidadGrafico(
  barras: readonly BarraGrafico[],
): string {
  const primero = barras[0]
  const ultimo = barras[barras.length - 1]
  if (!primero || !ultimo) {
    return 'No hay datos del balance de los últimos 30 días.'
  }

  const rango = `Neto diario del ${fechaLarga(primero.fecha)} al ${fechaLarga(ultimo.fecha)}`

  if (barras.every((barra) => barra.valor === 0)) {
    return `${rango}. Todos los días están en cero.`
  }

  const hoy = barras.find((barra) => barra.esHoy)
  const mejor = barras.reduce((actual, barra) =>
    barra.valor > actual.valor ? barra : actual,
  )
  const peor = barras.reduce((actual, barra) =>
    barra.valor < actual.valor ? barra : actual,
  )

  const partes = [rango]
  if (hoy) partes.push(`Hoy: ${formatearPesos(hoy.valor)}`)
  partes.push(`Mejor día: ${fechaCorta(mejor.fecha)} con ${formatearPesos(mejor.valor)}`)
  partes.push(`Peor día: ${fechaCorta(peor.fecha)} con ${formatearPesos(peor.valor)}`)

  return `${partes.join('. ')}.`
}

export type ClaveFila = 'servicios' | 'propinas' | 'compras'

export interface FilaBalance {
  clave: ClaveFila
  etiqueta: string
  valor: number
  /** "+" o "−" delante del monto; vacío cuando el valor es cero. */
  signo: '+' | '−' | ''
  tono: TonoNeto
}

/** Las tres filas de la tarjeta financiera principal. */
export function calcularFilasBalance(balance: Balance): FilaBalance[] {
  const servicios = aEnteroMonto(balance.totalServicios)
  const propinas = aEnteroMonto(balance.totalPropinas)
  const compras = aEnteroMonto(balance.totalCompras)

  return [
    {
      clave: 'servicios',
      etiqueta: 'Servicios cobrados',
      valor: servicios,
      signo: servicios > 0 ? '+' : '',
      tono: servicios > 0 ? 'positivo' : 'cero',
    },
    {
      clave: 'propinas',
      etiqueta: 'Propinas',
      valor: propinas,
      signo: propinas > 0 ? '+' : '',
      tono: propinas > 0 ? 'positivo' : 'cero',
    },
    {
      clave: 'compras',
      etiqueta: 'Compras de insumos',
      valor: compras,
      signo: compras > 0 ? '−' : '',
      tono: compras > 0 ? 'negativo' : 'cero',
    },
  ]
}

/**
 * Comprueba la fórmula documentada. La pantalla siempre muestra la
 * `gananciaNeta` de la API; esto solo verifica que las filas cuadren.
 */
export function esBalanceCoherente(balance: Balance): boolean {
  const esperado =
    aEnteroMonto(balance.totalServicios) +
    aEnteroMonto(balance.totalPropinas) -
    aEnteroMonto(balance.totalCompras)

  return esperado === aEnteroMonto(balance.gananciaNeta)
}
