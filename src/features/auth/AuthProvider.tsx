import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  CLAVE_SESION,
  EVENTO_SESION_CERRADA,
  limpiarSesionLegacy,
  type DetalleSesionCerrada,
} from '@/shared/api/almacenamientoSesion'
import { ejecutarAntesDeCerrarSesion } from './antesDeCerrarSesion'
import { AuthContext } from './auth-context'
import {
  actualizarPerfilEnSesion,
  borrarSesion,
  cargarSesion,
  guardarSesion,
  sesionDesdeRespuesta,
} from './sesion'
import {
  nombreDeSesion,
  type PerfilCliente,
  type RegistroPendiente,
  type RespuestaLogin,
  type Sesion,
} from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    limpiarSesionLegacy()
    return cargarSesion()
  })
  const [registroPendiente, setRegistroPendiente] =
    useState<RegistroPendiente | null>(null)

  useEffect(() => {
    function alCambiarAlmacen(evento: StorageEvent) {
      if (evento.key === CLAVE_SESION) {
        setSesion(cargarSesion())
      }
    }

    function alCerrarSesion(evento: Event) {
      const detalle = (evento as CustomEvent<DetalleSesionCerrada>).detail
      if (detalle?.zona === 'barbero' || detalle?.zona === 'cliente') {
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

  const iniciarSesion = useCallback(
    (respuesta: RespuestaLogin): Sesion => {
      // La sesión nueva no puede ver datos de la anterior.
      queryClient.clear()

      const nuevaSesion = sesionDesdeRespuesta(respuesta)
      guardarSesion(nuevaSesion)
      setSesion(nuevaSesion)
      setRegistroPendiente(null)
      return nuevaSesion
    },
    [queryClient],
  )

  const guardarRegistroPendiente = useCallback((registro: RegistroPendiente) => {
    // Solo memoria: no toca storage, URL, caché ni history.state.
    setRegistroPendiente(registro)
  }, [])

  const limpiarRegistroPendiente = useCallback(() => {
    setRegistroPendiente(null)
  }, [])

  const actualizarPerfil = useCallback((perfil: PerfilCliente) => {
    setSesion((actual) => {
      if (!actual || actual.usuario.tipo !== 'cliente') return actual
      const nueva = actualizarPerfilEnSesion(actual, perfil)
      guardarSesion(nueva)
      return nueva
    })
  }, [])

  const cerrarSesion = useCallback(async (): Promise<void> => {
    await ejecutarAntesDeCerrarSesion()
    queryClient.clear()
    borrarSesion(sesion?.tipo ?? 'barbero', 'manual')
    setSesion(null)
    setRegistroPendiente(null)
  }, [queryClient, sesion?.tipo])

  return (
    <AuthContext.Provider
      value={{
        sesion,
        estaAutenticado: sesion !== null,
        tipo: sesion?.tipo ?? null,
        usuario: sesion?.usuario ?? null,
        nombre: nombreDeSesion(sesion),
        registroPendiente,
        iniciarSesion,
        guardarRegistroPendiente,
        limpiarRegistroPendiente,
        actualizarPerfil,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
