import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { peticion } from '@/shared/api/client'
import {
  CLAVE_SESION_BARBERO,
  EVENTO_SESION_CERRADA,
  type DetalleSesionCerrada,
} from '@/shared/api/almacenamientoSesion'
import { ejecutarAntesDeCerrarSesion } from './antesDeCerrarSesion'
import { AuthContext } from './auth-context'
import {
  borrarSesionBarbero,
  cargarSesionBarbero,
  guardarSesionBarbero,
} from './sesionBarbero'
import type {
  CredencialesLogin,
  RespuestaLoginBarbero,
  SesionBarbero,
} from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionBarbero | null>(() =>
    cargarSesionBarbero(),
  )

  useEffect(() => {
    function alCambiarAlmacen(evento: StorageEvent) {
      if (evento.key === CLAVE_SESION_BARBERO) {
        setSesion(cargarSesionBarbero())
      }
    }

    function alCerrarSesion(evento: Event) {
      const detalle = (evento as CustomEvent<DetalleSesionCerrada>).detail
      if (detalle?.zona === 'barbero') {
        setSesion(null)
      }
    }

    window.addEventListener('storage', alCambiarAlmacen)
    window.addEventListener(EVENTO_SESION_CERRADA, alCerrarSesion)
    return () => {
      window.removeEventListener('storage', alCambiarAlmacen)
      window.removeEventListener(EVENTO_SESION_CERRADA, alCerrarSesion)
    }
  }, [])

  const login = useCallback(
    async (credenciales: CredencialesLogin): Promise<SesionBarbero> => {
      const respuesta = await peticion<RespuestaLoginBarbero>('/auth/login/barbero', {
        metodo: 'POST',
        cuerpo: credenciales,
        zona: 'publico',
        redirigirEn401: false,
      })

      const nombreCompleto =
        `${respuesta.barbero.nombres} ${respuesta.barbero.apellidos}`.trim()

      const nuevaSesion: SesionBarbero = {
        accessToken: respuesta.accessToken,
        nombre: nombreCompleto || respuesta.barbero.username,
        username: respuesta.barbero.username,
        nombreBarberia: respuesta.barbero.nombreBarberia ?? null,
      }

      guardarSesionBarbero(nuevaSesion)
      setSesion(nuevaSesion)
      return nuevaSesion
    },
    [],
  )

  const cerrarSesion = useCallback(async (): Promise<void> => {
    await ejecutarAntesDeCerrarSesion()
    borrarSesionBarbero('manual')
    setSesion(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        sesion,
        estaAutenticado: sesion !== null,
        nombre: sesion?.nombre ?? null,
        login,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
