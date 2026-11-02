/**
 * Tipos de Compras.
 *
 * Fuente única: `docs/backend/COMPRAS_Y_BALANCE.md`.
 * - `descripcion`: 1 a 150 caracteres (la API recorta espacios).
 * - `monto`: entero entre 1 y 50.000.000.
 * - `fechaBalance` lo pone el servidor (hoy en Bogotá); el cliente nunca lo envía.
 */

import type { Balance, MontoApi } from '@/features/cuentas/types'

export type { MontoApi }

export interface Compra {
  id: number
  descripcion: string
  monto: MontoApi
  fechaBalance: string
}

/** `GET /barbero/compras?fecha=`. */
export interface ListaCompras {
  fecha: string
  /** Suma de las compras de esa fecha, según el servidor. */
  total: MontoApi
  /** Ordenadas de la más reciente a la más antigua. */
  compras: Compra[]
}

/** `POST` (201) y `PATCH` (200) devuelven la compra y el balance actualizado. */
export interface RespuestaCompra {
  compra: Compra
  balance: Balance
}

export interface CrearCompraBody {
  descripcion: string
  monto: number
}

/** `PATCH` acepta al menos un campo. */
export interface EditarCompraBody {
  descripcion?: string
  monto?: number
}
