import { useQuery } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import { obtenerBalanceHoy, obtenerHistorialBalance } from './api'
import { clavesBalance } from './claves'

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

/**
 * Balance del día. `fecha` solo forma parte de la clave: el endpoint siempre
 * devuelve el día actual del backend.
 */
export function useBalanceHoy(fecha: string) {
  return useQuery({
    queryKey: clavesBalance.hoy(fecha),
    queryFn: obtenerBalanceHoy,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: reintentar,
  })
}

/** Historial de 30 días, del más reciente al más antiguo. */
export function useHistorialBalance(fecha: string) {
  return useQuery({
    queryKey: clavesBalance.historial(fecha),
    queryFn: obtenerHistorialBalance,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: reintentar,
  })
}
