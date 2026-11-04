import { peticion } from '@/shared/api/client'
import type {
  BarberoPublico,
  DisponibilidadPublica,
  SeguimientoCita,
} from './types'

function rutaBarbero(codigo: string): string {
  return `/public/barberos/${encodeURIComponent(codigo)}`
}

export function obtenerBarberoPublico(codigo: string): Promise<BarberoPublico> {
  return peticion<BarberoPublico>(rutaBarbero(codigo), { zona: 'publico' })
}

export function obtenerDisponibilidad(
  codigo: string,
  fecha: string,
  duracionMinutos: number,
): Promise<DisponibilidadPublica> {
  const parametros = new URLSearchParams({
    fecha,
    duracionMinutos: String(duracionMinutos),
  })
  return peticion<DisponibilidadPublica>(
    `${rutaBarbero(codigo)}/disponibilidad?${parametros.toString()}`,
    { zona: 'publico' },
  )
}

export function obtenerSeguimiento(token: string): Promise<SeguimientoCita> {
  return peticion<SeguimientoCita>(
    `/public/citas/${encodeURIComponent(token)}`,
    { zona: 'publico' },
  )
}
