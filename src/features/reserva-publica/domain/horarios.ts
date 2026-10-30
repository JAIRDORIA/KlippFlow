import type { EstadoSlot, SlotDisponibilidad } from '../types'

export type EstadoVisualSlot = 'libre' | 'por-confirmar' | 'ocupado'

const ESTADO_VISUAL: Record<EstadoSlot, EstadoVisualSlot> = {
  verde: 'libre',
  naranja: 'por-confirmar',
  rojo: 'ocupado',
}

const ETIQUETA_VISUAL: Record<EstadoVisualSlot, string> = {
  libre: 'Libre',
  'por-confirmar': 'Por confirmar',
  ocupado: 'Ocupado',
}

export function mapearEstadoSlot(estado: EstadoSlot): EstadoVisualSlot {
  return ESTADO_VISUAL[estado] ?? 'ocupado'
}

export function esSlotSeleccionable(estado: EstadoSlot): boolean {
  return mapearEstadoSlot(estado) === 'libre'
}

export function etiquetaEstadoSlot(estado: EstadoSlot): string {
  return ETIQUETA_VISUAL[mapearEstadoSlot(estado)]
}

/** El horario guardado solo sigue siendo válido si está libre en la última consulta. */
export function horaSigueDisponible(
  slots: readonly SlotDisponibilidad[],
  horaInicio: string | null,
): boolean {
  if (!horaInicio) return false
  return slots.some(
    (slot) => slot.horaInicio === horaInicio && esSlotSeleccionable(slot.estado),
  )
}
