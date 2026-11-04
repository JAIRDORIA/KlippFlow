import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { ErrorPeticion } from '@/shared/api/client'
import {
  obtenerBarberoPublico,
  obtenerDisponibilidad,
  obtenerSeguimiento,
} from './api'
import {
  obtenerCitaActivaDeCodigo,
  olvidarCitaGuardada,
} from './almacenamientoCitas'
import { debeMostrarAvisoCita, debeOlvidarCita } from './domain/avisoCita'
import { esError404 } from './domain/errores'
import type { CitaGuardada } from './types'

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

/**
 * Cita guardada de este barbero que **sigue viva**, validada contra el servidor.
 *
 * El aviso "Tienes una cita pendiente" no puede salir solo de `localStorage`:
 * una cita atendida, cancelada, rechazada o expirada se quedaría para siempre.
 * Se consulta el seguimiento y:
 * - se muestra solo con `pendiente` o `aceptada` de hoy en adelante,
 * - se olvida la cita guardada cuando el estado es final (o el token ya no
 *   existe, 404).
 *
 * Mientras el seguimiento no responde no se muestra: así, al abrir el link, no
 * aparece pegado un aviso viejo.
 */
export function useCitaActiva(codigo: string, hoy: string): CitaGuardada | null {
  const guardada = useMemo(() => obtenerCitaActivaDeCodigo(codigo), [codigo])
  const seguimiento = useSeguimiento(guardada?.token ?? '')

  const datos = seguimiento.data
    ? { estado: seguimiento.data.estado, fecha: seguimiento.data.fecha }
    : null

  const mostrar = debeMostrarAvisoCita(datos, hoy)
  const olvidar = debeOlvidarCita(datos, hoy) || esError404(seguimiento.error)

  useEffect(() => {
    if (!guardada || !olvidar) return
    olvidarCitaGuardada(guardada.token)
  }, [guardada, olvidar])

  return mostrar ? guardada : null
}
