import { cargarSesion } from '@/features/auth/sesion'
import { cargarSesionAdmin } from '@/features/auth/sesionAdmin'

/**
 * Qué sesión hay ahora mismo, sin depender de un provider de React.
 *
 * Lo usa la 404, que se puede mostrar fuera de las zonas (por ejemplo en
 * `/loquesea`) donde no hay `AuthProvider` ni `AdminAuthProvider`. Solo se
 * acepta un token vigente y del tipo correcto; la sesión de administrador no se
 * revela si no existe.
 */
export type SesionVisible = 'barbero' | 'cliente' | 'admin' | 'ninguna'

export function sesionVisible(ahoraMs: number = Date.now()): SesionVisible {
  const sesion = cargarSesion(ahoraMs)
  if (sesion?.tipo === 'barbero') return 'barbero'
  if (sesion?.tipo === 'cliente') return 'cliente'
  if (cargarSesionAdmin(ahoraMs)) return 'admin'
  return 'ninguna'
}
