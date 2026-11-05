import type { EstadoCita } from '@/features/reserva-publica/types'
import {
  ahoraBogota,
  hoyBogota,
  hora12,
  partesFecha,
  sumarDias,
} from '@/shared/lib/fechas'
import type { CitaCliente, MotivosCitaCliente } from '../types'

export type VarianteEstadoCita = 'neutro' | 'ambar' | 'verde' | 'rojo'

const ETIQUETAS: Record<EstadoCita, string> = {
  pendiente: 'Esperando respuesta',
  aceptada: 'Aceptada',
  rechazada: 'No aceptada',
  cancelada: 'Cancelada',
  expirada: 'Sin respuesta',
  atendida: 'Atendida',
  no_asistio: 'No asististe',
}

const VARIANTES: Record<EstadoCita, VarianteEstadoCita> = {
  pendiente: 'ambar',
  aceptada: 'verde',
  rechazada: 'rojo',
  cancelada: 'rojo',
  expirada: 'neutro',
  atendida: 'verde',
  no_asistio: 'neutro',
}

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

export function etiquetaEstadoCita(estado: EstadoCita): string {
  return ETIQUETAS[estado]
}

export function varianteEstadoCita(estado: EstadoCita): VarianteEstadoCita {
  return VARIANTES[estado]
}

export function motivoRechazoLegible(motivo: string | null | undefined): string | null {
  if (!motivo) return null
  if (motivo === 'horario_ocupado') {
    return 'Ese horario ya está ocupado. Puedes pedir otro.'
  }
  if (motivo === 'no_disponible') {
    return 'El barbero no está disponible. Puedes pedir otro horario.'
  }
  return 'No fue posible aceptar tu solicitud. Puedes pedir otro horario.'
}

export function motivoCancelacionLegible(
  motivo: string | null | undefined,
): string | null {
  if (!motivo) return null
  const limpio = motivo.trim()
  return limpio || null
}

export function mensajeEstadoCita(
  estado: EstadoCita,
  motivos: MotivosCitaCliente,
): string {
  switch (estado) {
    case 'pendiente':
      return 'El barbero todavía no ha respondido tu solicitud.'
    case 'aceptada':
      return 'Tu cita fue aceptada.'
    case 'rechazada': {
      const motivo = motivoRechazoLegible(motivos.motivoRechazo)
      return motivo
        ? `Tu solicitud no fue aceptada. ${motivo}`
        : 'Tu solicitud no fue aceptada.'
    }
    case 'cancelada': {
      const motivo = motivoCancelacionLegible(motivos.motivoCancelacion)
      return motivo ? `Tu cita fue cancelada: ${motivo}` : 'Tu cita fue cancelada.'
    }
    case 'expirada':
      return 'El barbero no alcanzó a responder. Puedes pedir otro horario.'
    case 'atendida':
      return 'Gracias por venir.'
    case 'no_asistio':
      return 'No asististe a esta cita.'
  }
}

/** "Hoy", "Mañana" o "dd mmm" (fecha de calendario, referencia en Bogotá). */
export function fechaCitaLegible(
  fechaISO: string,
  referencia: Date = new Date(),
): string {
  const partes = partesFecha(fechaISO)
  if (!partes) return ''

  const hoy = hoyBogota(referencia)
  if (fechaISO === hoy) return 'Hoy'
  if (fechaISO === sumarDias(hoy, 1)) return 'Mañana'

  const mes = MESES[partes.month - 1]
  return mes ? `${partes.day} ${mes}` : ''
}

/** Hora de la cita en formato 12 h de Bogotá. */
export function horaCitaLegible(hora24: string): string {
  return hora12(hora24)
}

/** Próximas aceptadas y pendientes, con las pendientes primero. */
export function citasDestacadas(
  citas: readonly CitaCliente[],
  referencia: Date = new Date(),
  limite = 3,
): CitaCliente[] {
  const hoy = hoyBogota(referencia)
  const ahora = ahoraBogota(referencia)

  return citas
    .filter((cita) => {
      if (cita.estado === 'pendiente') return true
      if (cita.estado !== 'aceptada') return false
      if (cita.fecha > hoy) return true
      return cita.fecha === hoy && cita.horaFin >= ahora.hora
    })
    .sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === 'pendiente' ? -1 : 1
      return `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`)
    })
    .slice(0, Math.max(0, limite))
}
