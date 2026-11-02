import { useQuery } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import { clavesConsulta } from '@/features/agenda/claves'
import { REFRESCO_AGENDA_MS } from '@/features/agenda/hooks'
import { obtenerSolicitudes } from './api'

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

/**
 * Consulta de solicitudes pendientes.
 *
 * Se monta siempre dentro de `AppLayout` para que el badge del `BottomNav`
 * esté al día en cualquier pestaña, y se reutiliza en `/app/solicitudes`
 * (misma clave, una sola petición).
 */
export function useSolicitudes() {
  return useQuery({
    queryKey: clavesConsulta.solicitudes,
    queryFn: obtenerSolicitudes,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: intervaloVisible,
    refetchIntervalInBackground: false,
    retry: reintentar,
  })
}
