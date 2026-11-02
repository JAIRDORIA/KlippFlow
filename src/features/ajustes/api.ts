import { peticion } from '@/shared/api/client'
import type {
  Configuracion,
  CrearHorarioBody,
  CrearServicioBody,
  EditarHorarioBody,
  EditarServicioBody,
  Horario,
  Servicio,
} from './types'

/**
 * Endpoints de Ajustes.
 * Fuente: `docs/backend/SERVICIOS.md` y `HORARIOS_Y_CONFIGURACION.md`.
 */

export function obtenerConfiguracion(): Promise<Configuracion> {
  return peticion<Configuracion>('/barbero/configuracion', { zona: 'barbero' })
}

/** Siempre incluye los inactivos: la pantalla los muestra atenuados. */
export function obtenerServicios(): Promise<Servicio[]> {
  return peticion<Servicio[]>('/barbero/servicios?incluirInactivos=true', {
    zona: 'barbero',
  })
}

export function crearServicio(cuerpo: CrearServicioBody): Promise<Servicio> {
  return peticion<Servicio>('/barbero/servicios', {
    metodo: 'POST',
    cuerpo,
    zona: 'barbero',
  })
}

export function editarServicio(
  id: number,
  cambios: EditarServicioBody,
): Promise<Servicio> {
  return peticion<Servicio>(`/barbero/servicios/${encodeURIComponent(String(id))}`, {
    metodo: 'PATCH',
    cuerpo: cambios,
    zona: 'barbero',
  })
}

/** Desactivar es un borrado lógico: `activo = false`. */
export function desactivarServicio(id: number): Promise<Servicio> {
  return editarServicio(id, { activo: false })
}

export function reactivarServicio(id: number): Promise<Servicio> {
  return editarServicio(id, { activo: true })
}

export function obtenerHorarios(): Promise<Horario[]> {
  return peticion<Horario[]>('/barbero/horarios', { zona: 'barbero' })
}

export function crearHorario(cuerpo: CrearHorarioBody): Promise<Horario> {
  return peticion<Horario>('/barbero/horarios', {
    metodo: 'POST',
    cuerpo,
    zona: 'barbero',
  })
}

export function editarHorario(
  id: number,
  cambios: EditarHorarioBody,
): Promise<Horario> {
  return peticion<Horario>(`/barbero/horarios/${encodeURIComponent(String(id))}`, {
    metodo: 'PATCH',
    cuerpo: cambios,
    zona: 'barbero',
  })
}

/** DELETE es borrado físico; ninguna tabla referencia `horarios_trabajo`. */
export async function eliminarHorario(id: number): Promise<void> {
  await peticion<void>(`/barbero/horarios/${encodeURIComponent(String(id))}`, {
    metodo: 'DELETE',
    zona: 'barbero',
  })
}
