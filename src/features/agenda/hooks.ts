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
  rechazarSolicitud,
} from './api'
import { PREFIJO_BARBERO, clavesConsulta } from './claves'
import type { MotivoRechazo } from './types'

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
