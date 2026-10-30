import { CLAVE_SESION_ADMIN } from '@/shared/api/almacenamientoSesion'

/**
 * MARCADOR para el prompt del panel de administración.
 * El AuthProvider real del admin debe usar esta misma clave, distinta de la del
 * barbero, y validar el JWT con tipo "admin" al montar y en cada 401.
 */
export { CLAVE_SESION_ADMIN }

export interface SesionAdminMarcador {
  accessToken: string
  nombre: string
}

export function leerSesionAdminMarcador(): SesionAdminMarcador | null {
  if (typeof window === 'undefined') return null

  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION_ADMIN)
    if (!crudo) return null
    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null
    const registro = datos as Record<string, unknown>
    if (typeof registro.accessToken !== 'string') return null
    return {
      accessToken: registro.accessToken,
      nombre: typeof registro.nombre === 'string' ? registro.nombre : '',
    }
  } catch {
    return null
  }
}
