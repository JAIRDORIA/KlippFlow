import { peticion } from '@/shared/api/client'
import type { DisponibilidadPublica } from '@/features/reserva-publica/types'
import type {
  DashboardHoy,
  MotivoRechazo,
  RespuestaAccionCita,
  RespuestaAtencion,
  RespuestaPropina,
} from './types'

/**
 * Endpoints del panel del barbero.
 * Fuente: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md`,
 * `docs/backend/ATENCIONES_Y_PROPINAS.md` y `docs/backend/CAMBIO_HORA.md`. El
 * `barberoId` nunca se envía: sale del JWT en el backend.
 */

function rutaCita(id: number): string {
  return `/barbero/citas/${encodeURIComponent(String(id))}`
}

export function obtenerDashboardHoy(): Promise<DashboardHoy> {
  return peticion<DashboardHoy>('/barbero/dashboard/hoy', { zona: 'barbero' })
}

export function aceptarSolicitud(id: number): Promise<RespuestaAccionCita> {
  return peticion<RespuestaAccionCita>(`${rutaCita(id)}/aceptar`, {
    metodo: 'POST',
    zona: 'barbero',
  })
}

export function rechazarSolicitud(
  id: number,
  motivo: MotivoRechazo,
): Promise<RespuestaAccionCita> {
  return peticion<RespuestaAccionCita>(`${rutaCita(id)}/rechazar`, {
    metodo: 'POST',
    cuerpo: { motivo },
    zona: 'barbero',
  })
}

export function cancelarCita(
  id: number,
  motivo?: string,
): Promise<RespuestaAccionCita> {
  const limpio = motivo?.trim()
  return peticion<RespuestaAccionCita>(`${rutaCita(id)}/cancelar`, {
    metodo: 'POST',
    cuerpo: limpio ? { motivo: limpio } : undefined,
    zona: 'barbero',
  })
}

export function marcarNoAsistio(id: number): Promise<RespuestaAccionCita> {
  return peticion<RespuestaAccionCita>(`${rutaCita(id)}/no-asistio`, {
    metodo: 'POST',
    zona: 'barbero',
  })
}

/** El body es opcional: sin propina se envía sin cuerpo. */
export function marcarAtendido(
  id: number,
  montoPropina?: number,
): Promise<RespuestaAtencion> {
  return peticion<RespuestaAtencion>(`${rutaCita(id)}/atendido`, {
    metodo: 'POST',
    cuerpo: montoPropina === undefined ? undefined : { montoPropina },
    zona: 'barbero',
  })
}

/** Envía el nuevo valor total. `0` quita la propina. */
export function corregirPropina(
  id: number,
  montoPropina: number,
): Promise<RespuestaPropina> {
  return peticion<RespuestaPropina>(`${rutaCita(id)}/propina`, {
    metodo: 'PUT',
    cuerpo: { montoPropina },
    zona: 'barbero',
  })
}

export interface CuerpoPropuestaHora {
  fecha: string
  horaInicio: string
}

/**
 * Slots para reprogramar una cita concreta: misma forma y reglas que la
 * disponibilidad pública, y el backend excluye la propia cita de las
 * ocupaciones. `docs/backend/CAMBIO_HORA.md`.
 */
export function obtenerDisponibilidadCambioHora(
  id: number,
  fecha: string,
): Promise<DisponibilidadPublica> {
  const parametros = new URLSearchParams({ fecha })
  return peticion<DisponibilidadPublica>(
    `${rutaCita(id)}/disponibilidad?${parametros.toString()}`,
    { zona: 'barbero' },
  )
}

/**
 * Propone una nueva hora. Reemplaza cualquier propuesta anterior de la misma
 * cita y devuelve la cita con `propuestaCambioHora` y `whatsappUrl`.
 */
export function proponerCambioHora(
  id: number,
  cuerpo: CuerpoPropuestaHora,
): Promise<RespuestaAccionCita> {
  return peticion<RespuestaAccionCita>(`${rutaCita(id)}/proponer-cambio-hora`, {
    metodo: 'POST',
    cuerpo,
    zona: 'barbero',
  })
}
