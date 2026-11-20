/**
 * Propuesta de cambio de hora de una cita.
 *
 * El barbero propone una nueva fecha/hora y la propuesta vive como máximo 1
 * hora. Fuente: `docs/backend/CAMBIO_HORA.md`.
 *
 * `creadaEn` y `expiraEn` llegan como fecha ISO (string en JSON). La vigencia
 * real la decide el backend (job `limpiar-propuestas-vencidas`); aquí solo se
 * calcula la cuenta regresiva de la interfaz y se evita ofrecer acciones sobre
 * una propuesta ya vencida.
 */

import { formatearDuracion } from './format'

export interface PropuestaCambioHora {
  /** `YYYY-MM-DD` en hora de Bogotá. */
  fecha: string
  /** `HH:mm` en hora de Bogotá. */
  horaInicio: string
  /** `HH:mm` en hora de Bogotá. */
  horaFin: string
  creadaEn: string
  expiraEn: string
}

export interface CuentaPropuesta {
  vigente: boolean
  minutos: number
  /** "expira en 45 min" o "propuesta expirada". */
  texto: string
}

function instanteExpira(
  propuesta: PropuestaCambioHora | null | undefined,
): number | null {
  if (!propuesta || typeof propuesta.expiraEn !== 'string') return null
  const instante = Date.parse(propuesta.expiraEn)
  return Number.isFinite(instante) ? instante : null
}

/**
 * `true` mientras la propuesta siga vigente. Si `expiraEn` no se puede
 * interpretar se asume vigente: el backend es quien rechaza con 409 y así no se
 * ocultan acciones por un dato raro.
 */
export function estaVigente(
  propuesta: PropuestaCambioHora | null | undefined,
  ahoraMs: number = Date.now(),
): boolean {
  if (!propuesta) return false
  const expira = instanteExpira(propuesta)
  if (expira === null) return true
  return expira > ahoraMs
}

/** Devuelve la propuesta solo si sigue vigente; si no, `null`. */
export function propuestaVigente(
  propuesta: PropuestaCambioHora | null | undefined,
  ahoraMs: number = Date.now(),
): PropuestaCambioHora | null {
  return estaVigente(propuesta, ahoraMs) ? (propuesta ?? null) : null
}

/** Cuenta regresiva de la propuesta, o `null` si no trae `expiraEn` válido. */
export function calcularCuentaPropuesta(
  propuesta: PropuestaCambioHora | null | undefined,
  ahoraMs: number = Date.now(),
): CuentaPropuesta | null {
  const expira = instanteExpira(propuesta)
  if (expira === null) return null

  const restante = expira - ahoraMs
  if (restante <= 0) {
    return { vigente: false, minutos: 0, texto: 'propuesta expirada' }
  }

  const minutos = Math.ceil(restante / 60_000)
  return {
    vigente: true,
    minutos,
    texto:
      minutos < 1
        ? 'expira en menos de 1 min'
        : `expira en ${formatearDuracion(minutos)}`,
  }
}
