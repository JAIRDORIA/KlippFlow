import { useMutation, useQuery } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import {
  crearCita,
  obtenerBarberoPublico,
  obtenerDisponibilidad,
  obtenerSeguimiento,
} from './api'
import type { CrearCitaBody } from './types'

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

export const clavesConsultaPublica = {
  barbero: (codigo: string) => ['publico', 'barbero', codigo] as const,
  disponibilidad: (codigo: string, fecha: string, duracionMinutos: number) =>
    ['publico', 'disponibilidad', codigo, fecha, duracionMinutos] as const,
  seguimiento: (token: string) => ['publico', 'seguimiento', token] as const,
}

export function useBarberoPublico(codigo: string) {
  return useQuery({
    queryKey: clavesConsultaPublica.barbero(codigo),
    queryFn: () => obtenerBarberoPublico(codigo),
    enabled: codigo.length > 0,
    staleTime: 60_000,
    retry: reintentar,
  })
}

export function useDisponibilidad(
  codigo: string,
  fecha: string,
  duracionMinutos: number,
) {
  const duracionValida =
    Number.isInteger(duracionMinutos) &&
    duracionMinutos >= 5 &&
    duracionMinutos <= 600 &&
    duracionMinutos % 5 === 0

  return useQuery({
    queryKey: clavesConsultaPublica.disponibilidad(codigo, fecha, duracionMinutos),
    queryFn: () => obtenerDisponibilidad(codigo, fecha, duracionMinutos),
    enabled: codigo.length > 0 && fecha.length > 0 && duracionValida,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    retry: reintentar,
  })
}

export function useCrearCita(codigo: string) {
  return useMutation({
    mutationFn: (cuerpo: CrearCitaBody) => crearCita(codigo, cuerpo),
  })
}

export function useSeguimiento(token: string) {
  return useQuery({
    queryKey: clavesConsultaPublica.seguimiento(token),
    queryFn: () => obtenerSeguimiento(token),
    enabled: token.length > 0,
    staleTime: 0,
    retry: reintentar,
    refetchInterval: (consulta) => {
      const estado = consulta.state.data?.estado
      if (estado !== 'pendiente') return false
      if (
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return false
      }
      return 30_000
    },
    refetchIntervalInBackground: false,
  })
}
