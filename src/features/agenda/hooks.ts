import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import {
  aceptarSolicitud,
  cancelarCita,
  corregirPropina,
  marcarAtendido,
  marcarNoAsistio,
  obtenerDashboardHoy,
  obtenerDisponibilidadCambioHora,
  obtenerServiciosActivos,
  proponerCambioHora,
  rechazarSolicitud,
  registrarServicioSinCita,
} from './api'
import { PREFIJO_BARBERO, clavesConsulta } from './claves'
import type { CuerpoServicioSinCita, MotivoRechazo } from './types'

export const REFRESCO_AGENDA_MS = 60_000

/** El sondeo de 60 s solo corre con la pestaña visible. */
function intervaloVisible(): number | false {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return false
  }
  return REFRESCO_AGENDA_MS
}

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

/** Un 409/404 significa que el estado cambió: hay que volver a leer. */
export function esCambioDeEstado(error: unknown): boolean {
  return (
    error instanceof ErrorPeticion && (error.status === 409 || error.status === 404)
  )
}

/**
 * Invalida dashboard, solicitudes y la clave reservada de balance. Como todas
 * cuelgan de `barbero`, una sola llamada las cubre.
 */
export function useInvalidarAgenda() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PREFIJO_BARBERO })
  }, [queryClient])
}

export function useDashboardHoy() {
  return useQuery({
    queryKey: clavesConsulta.dashboardHoy,
    queryFn: obtenerDashboardHoy,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: intervaloVisible,
    refetchIntervalInBackground: false,
    retry: reintentar,
  })
}

/**
 * Catálogo activo para el selector de «cliente sin cita». Solo se consulta con
 * el Sheet abierto (`habilitada`), porque el catálogo también vive en Ajustes.
 */
export function useServiciosActivos(habilitada = true) {
  return useQuery({
    queryKey: clavesConsulta.serviciosActivos,
    queryFn: obtenerServiciosActivos,
    enabled: habilitada,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: reintentar,
  })
}

/**
 * Registra un cliente sin cita. Además de la agenda (`aceptada` ocupa tiempo),
 * invalida todo `barbero`, así que el balance de hoy se refresca solo cuando el
 * modo es `atendido`. Un 409 de cruce también releerá la agenda.
 */
export function useRegistrarServicioSinCita() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: (cuerpo: CuerpoServicioSinCita) => registrarServicioSinCita(cuerpo),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export interface VariablesAtencion {
  id: number
  montoPropina?: number
}

export interface VariablesPropina {
  id: number
  montoPropina: number
}

export function useAceptarSolicitud() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: (id: number) => aceptarSolicitud(id),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useRechazarSolicitud() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: MotivoRechazo }) =>
      rechazarSolicitud(id, motivo),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useCancelarCita() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      cancelarCita(id, motivo),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useMarcarNoAsistio() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: (id: number) => marcarNoAsistio(id),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useMarcarAtendido() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: ({ id, montoPropina }: VariablesAtencion) =>
      marcarAtendido(id, montoPropina),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useCorregirPropina() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: ({ id, montoPropina }: VariablesPropina) =>
      corregirPropina(id, montoPropina),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Slots para reprogramar una cita. Solo se consulta con el Sheet abierto y una
 * fecha válida; la semántica verde/naranja/rojo es la misma de la reserva
 * pública, así que se reutiliza tal cual.
 */
export function useDisponibilidadCambioHora(
  id: number,
  fecha: string,
  habilitada = true,
) {
  return useQuery({
    queryKey: clavesConsulta.disponibilidadCambioHora(id, fecha),
    queryFn: () => obtenerDisponibilidadCambioHora(id, fecha),
    enabled:
      habilitada &&
      Number.isInteger(id) &&
      id > 0 &&
      PATRON_FECHA.test(fecha),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    retry: reintentar,
  })
}

export interface VariablesProponerHora {
  id: number
  fecha: string
  horaInicio: string
}

export function useProponerCambioHora() {
  const invalidar = useInvalidarAgenda()
  return useMutation({
    mutationFn: ({ id, fecha, horaInicio }: VariablesProponerHora) =>
      proponerCambioHora(id, { fecha, horaInicio }),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}
