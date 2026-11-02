import { cargarSesionAdmin } from '@/features/auth/sesionAdmin'
import { cargarSesionBarbero } from '@/features/auth/sesionBarbero'

/**
 * Qué sesión hay ahora mismo, sin depender de un provider de React.
 *
 * Lo usa la 404, que se puede mostrar fuera de las zonas (por ejemplo en
 * `/loquesea`) donde no hay `AuthProvider` ni `AdminAuthProvider`. Solo se
 * acepta un token vigente y del tipo correcto; la sesión de administrador no se
 * revela si no existe.
 */
export type SesionVisible = 'barbero' | 'admin' | 'ninguna'

export function sesionVisible(ahoraMs: number = Date.now()): SesionVisible {
  if (cargarSesionBarbero(ahoraMs)) return 'barbero'
  if (cargarSesionAdmin(ahoraMs)) return 'admin'
  return 'ninguna'
}
