import { peticion } from '@/shared/api/client'
import type { Balance } from './types'

/**
 * Endpoints de balance.
 * Fuente: `docs/backend/COMPRAS_Y_BALANCE.md`. El `barberoId` nunca se envía.
 */

/** `GET /barbero/balance/hoy`: ceros si no hay fila del día. */
export function obtenerBalanceHoy(): Promise<Balance> {
  return peticion<Balance>('/barbero/balance/hoy', { zona: 'barbero' })
}

/**
 * `GET /barbero/balance/historial`: 30 elementos, del más reciente al más
 * antiguo, incluido hoy. Los días sin movimiento llegan en ceros.
 */
export function obtenerHistorialBalance(): Promise<Balance[]> {
  return peticion<Balance[]>('/barbero/balance/historial', { zona: 'barbero' })
}
