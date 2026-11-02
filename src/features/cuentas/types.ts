/**
 * Tipos de Cuentas y del balance diario.
 *
 * Fuente única: `docs/backend/COMPRAS_Y_BALANCE.md`. Los montos pueden llegar
 * como número o como texto; siempre se convierten con `Number`.
 */

export type MontoApi = number | string

/**
 * Resumen del día (`GET /barbero/balance/hoy`) y elemento del historial
 * (`GET /barbero/balance/historial`).
 */
export interface Balance {
  fecha: string
  /** Existe en la API, pero en la Fase 1 siempre vale 0. No se muestra. */
  totalAnticipos: MontoApi
  totalServicios: MontoApi
  totalPropinas: MontoApi
  /** Existe en la API, pero en la Fase 1 siempre vale 0. No se muestra. */
  totalDevoluciones: MontoApi
  totalCompras: MontoApi
  gananciaNeta: MontoApi
}
