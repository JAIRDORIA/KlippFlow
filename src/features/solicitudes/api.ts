import { peticion } from '@/shared/api/client'
import type { Solicitud } from '@/features/agenda/types'

/**
 * `GET /barbero/solicitudes`: citas `pendiente` vigentes ordenadas por
 * `expira_en` ascendente (las más urgentes primero).
 * Fuente: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md`.
 */
export function obtenerSolicitudes(): Promise<Solicitud[]> {
  return peticion<Solicitud[]>('/barbero/solicitudes', { zona: 'barbero' })
}
