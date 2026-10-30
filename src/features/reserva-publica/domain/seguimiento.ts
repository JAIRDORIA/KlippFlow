import type { EstadoCita, MotivoRechazo } from '../types'

export type IconoSeguimiento = 'reloj' | 'check' | 'cruz' | 'usuario-x'
export type ColorSeguimiento = 'ambar' | 'verde' | 'rojo' | 'gris'

export interface EstadoSeguimiento {
  titulo: string
  icono: IconoSeguimiento
  color: ColorSeguimiento
  nota?: string
}

export const ESTADOS_SEGUIMIENTO: Record<EstadoCita, EstadoSeguimiento> = {
  pendiente: {
    titulo: 'Cita creada',
    icono: 'reloj',
    color: 'ambar',
    nota: 'Tiene hasta 2 horas para responder',
  },
  aceptada: {
    titulo: 'Cita confirmada',
    icono: 'check',
    color: 'verde',
  },
  rechazada: {
    titulo: 'Solicitud rechazada',
    icono: 'cruz',
    color: 'rojo',
  },
  cancelada: {
    titulo: 'Cita cancelada',
    icono: 'cruz',
    color: 'rojo',
  },
  expirada: {
    titulo: 'La solicitud expiró',
    icono: 'reloj',
    color: 'gris',
  },
  atendida: {
    titulo: 'Gracias por venir',
    icono: 'check',
    color: 'verde',
  },
  no_asistio: {
    titulo: 'Cita no asistida',
    icono: 'usuario-x',
    color: 'gris',
  },
}

export function infoEstadoSeguimiento(estado: EstadoCita): EstadoSeguimiento {
  return ESTADOS_SEGUIMIENTO[estado] ?? ESTADOS_SEGUIMIENTO.pendiente
}

const MOTIVOS_RECHAZO: Record<MotivoRechazo, string> = {
  horario_ocupado: 'Horario ocupado',
  no_disponible: 'No disponible',
}

export function etiquetaMotivoRechazo(motivo: MotivoRechazo): string {
  return MOTIVOS_RECHAZO[motivo] ?? motivo
}
