import { formatearDuracion } from '@/shared/lib/format'

/**
 * Cuenta regresiva de una solicitud.
 *
 * La API entrega `minutosRestantes` en el momento de la consulta; sumando el
 * tiempo transcurrido desde que se obtuvo el dato se recalcula sin volver a
 * pedirlo. Fuente: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md`.
 */

export const TICK_CUENTA_REGRESIVA_MS = 30_000

export interface CuentaRegresiva {
  vencida: boolean
  minutos: number
  texto: string
}

export function calcularCuentaRegresiva(
  minutosRestantes: number | null | undefined,
  obtenidoEnMs: number,
  ahoraMs: number,
): CuentaRegresiva | null {
  if (
    typeof minutosRestantes !== 'number' ||
    !Number.isFinite(minutosRestantes) ||
    !Number.isFinite(obtenidoEnMs)
  ) {
    return null
  }

  const venceEn = obtenidoEnMs + Math.max(0, minutosRestantes) * 60_000
  const restanteMs = venceEn - ahoraMs

  if (restanteMs <= 0) {
    return { vencida: true, minutos: 0, texto: 'expirada' }
  }

  if (restanteMs < 60_000) {
    return { vencida: false, minutos: 1, texto: 'expira en menos de 1 min' }
  }

  const minutos = Math.ceil(restanteMs / 60_000)
  return {
    vencida: false,
    minutos,
    texto: `expira en ${formatearDuracion(minutos)}`,
  }
}
