import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { loginAdmin } from '@/features/admin/api'
import {
  CLAVE_SESION_ADMIN,
  EVENTO_SESION_CERRADA,
  type DetalleSesionCerrada,
} from '@/shared/api/almacenamientoSesion'
import { AdminAuthContext } from './admin-auth-context'
import {
  borrarSesionAdmin,
  cargarSesionAdmin,
  guardarSesionAdmin,
} from './sesionAdmin'
import type { CredencialesLogin, SesionAdmin } from './types'

/**
 * Sesión del administrador, separada de la del barbero:
 * - clave propia (`klippflow.admin.sesion`),
 * - valida el `tipo: 'admin'` del JWT al montar,
 * - al quedar sin sesión borra solo las consultas `['admin', …]`.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sesion, setSesion] = useState<SesionAdmin | null>(() => cargarSesionAdmin())

  useEffect(() => {
    function alCambiarAlmacen(evento: StorageEvent) {
      if (evento.key === CLAVE_SESION_ADMIN) {
        setSesion(cargarSesionAdmin())
      }
    }

    function alCerrarSesion(evento: Event) {
      const detalle = (evento as CustomEvent<DetalleSesionCerrada>).detail
      if (detalle?.zona === 'admin') setSesion(null)
    }

    window.addEventListener('storage', alCambiarAlmacen)
    window.addEventListener(EVENTO_SESION_CERRADA, alCerrarSesion)

    return () => {
      window.removeEventListener('storage', alCambiarAlmacen)
      window.removeEventListener(EVENTO_SESION_CERRADA, alCerrarSesion)
    }
  }, [])

  useEffect(() => {
    if (sesion) return
    // Solo la caché del panel: la del barbero no se toca.
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [sesion, queryClient])

  const login = useCallback(
    async (credenciales: CredencialesLogin): Promise<SesionAdmin> => {
      const respuesta = await loginAdmin(credenciales)

      const nuevaSesion: SesionAdmin = {
        accessToken: respuesta.accessToken,
        id: respuesta.admin.id,
        username: respuesta.admin.username,
        nombre: respuesta.admin.nombre,
      }

      guardarSesionAdmin(nuevaSesion)
      setSesion(nuevaSesion)
      return nuevaSesion
    },
    [],
  )

  const cerrarSesion = useCallback((): void => {
    borrarSesionAdmin('manual')
    setSesion(null)
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        sesion,
        estaAutenticado: sesion !== null,
        login,
        cerrarSesion,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
