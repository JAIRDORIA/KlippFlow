import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import type {
  ActualizarPerfilBody,
  CambiarContrasenaBody,
  CredencialesLoginUnificado,
  DatosCompletarCuenta,
  DatosRegistroCliente,
  PerfilCliente,
  RespuestaGoogle,
  RespuestaLogin,
  RespuestaLoginCliente,
  RespuestaRegistroCliente,
} from '@/features/auth/types'
import { ErrorPeticion } from '@/shared/api/client'
import {
  aceptarCambioHora,
  actualizarPerfil,
  cambiarContrasena,
  completarCuenta,
  crearCitaCliente,
  loginGoogle,
  loginUnificado,
  obtenerBarberosCliente,
  obtenerCitaCliente,
  obtenerCitasCliente,
  obtenerPerfil,
  rechazarCambioHora,
  registrarCliente,
  vincularBarbero,
} from './api'
import type {
  CitaCliente,
  CitaClienteDetalle,
  CrearCitaClienteBody,
  VincularBarberoResponse,
} from './types'

export const clavesCliente = {
  perfil: ['cliente', 'perfil'] as const,
  barberos: ['cliente', 'barberos'] as const,
  citas: ['cliente', 'citas'] as const,
  cita: (id: number) => ['cliente', 'citas', id] as const,
}

function pestanaVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

function hayPendiente(citas: readonly { estado: string }[] | undefined): boolean {
  return citas?.some((cita) => cita.estado === 'pendiente') ?? false
}

/** Una propuesta vigente también necesita refresco: puede expirar o responderse. */
function hayPropuesta(
  citas: readonly { propuestaCambioHora?: unknown }[] | undefined,
): boolean {
  return citas?.some((cita) => Boolean(cita.propuestaCambioHora)) ?? false
}

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

export function useLoginUnificado() {
  const { iniciarSesion } = useAuth()

  return useMutation<RespuestaLogin, unknown, CredencialesLoginUnificado>({
    mutationFn: loginUnificado,
    onSuccess: (respuesta) => {
      iniciarSesion(respuesta)
    },
  })
}

export function useLoginGoogle() {
  const { iniciarSesion, guardarRegistroPendiente } = useAuth()

  return useMutation<RespuestaGoogle, unknown, string>({
    mutationFn: loginGoogle,
    onSuccess: (respuesta) => {
      if (respuesta.requiereCompletar) {
        guardarRegistroPendiente({
          registroToken: respuesta.registroToken,
          perfil: respuesta.perfil,
        })
        return
      }
      iniciarSesion(respuesta)
    },
  })
}

export function useRegistroCliente() {
  const {
    iniciarSesion,
    actualizarPerfil: actualizarPerfilSesion,
  } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<
    RespuestaRegistroCliente,
    unknown,
    DatosRegistroCliente
  >({
    mutationFn: registrarCliente,
    onSuccess: (respuesta) => {
      // Mismo mecanismo que el login: guarda token y cliente en la ranura única.
      iniciarSesion(respuesta)

      // Refresca el perfil real con GET /cliente/perfil. Si falla, la cuenta ya
      // quedó creada y la sesión guardada sigue siendo válida.
      void obtenerPerfil()
        .then((perfil) => {
          actualizarPerfilSesion(perfil)
          queryClient.setQueryData(clavesCliente.perfil, perfil)
        })
        .catch(() => undefined)
    },
  })
}

export function useCompletarCuenta() {
  const { registroPendiente, iniciarSesion } = useAuth()

  return useMutation<
    RespuestaLoginCliente,
    unknown,
    Omit<DatosCompletarCuenta, 'registroToken'>
  >({
    mutationFn: (datos) => {
      if (!registroPendiente) {
        return Promise.reject(
          new ErrorPeticion({
            status: 401,
            mensaje: 'Vuelve a continuar con Google',
          }),
        )
      }
      return completarCuenta({
        ...datos,
        registroToken: registroPendiente.registroToken,
      })
    },
    onSuccess: (respuesta) => {
      iniciarSesion(respuesta)
    },
  })
}

export function usePerfilCliente() {
  const { tipo } = useAuth()

  return useQuery<PerfilCliente>({
    queryKey: clavesCliente.perfil,
    queryFn: obtenerPerfil,
    enabled: tipo === 'cliente',
    staleTime: 60_000,
    retry: reintentar,
  })
}

export function useBarberosCliente() {
  const { tipo } = useAuth()

  return useQuery({
    queryKey: clavesCliente.barberos,
    queryFn: obtenerBarberosCliente,
    enabled: tipo === 'cliente',
    staleTime: 60_000,
    retry: reintentar,
  })
}

export function useCitasCliente() {
  const { tipo } = useAuth()

  return useQuery<CitaCliente[]>({
    queryKey: clavesCliente.citas,
    queryFn: obtenerCitasCliente,
    enabled: tipo === 'cliente',
    staleTime: 30_000,
    retry: reintentar,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (consulta) => {
      if (!pestanaVisible()) return false
      const datos = consulta.state.data
      return hayPendiente(datos) || hayPropuesta(datos) ? 30_000 : false
    },
  })
}

export function useCitaCliente(id: number, habilitada = true) {
  const { tipo } = useAuth()

  return useQuery<CitaClienteDetalle>({
    queryKey: clavesCliente.cita(id),
    queryFn: () => obtenerCitaCliente(id),
    enabled: tipo === 'cliente' && habilitada && Number.isInteger(id) && id > 0,
    staleTime: 30_000,
    retry: reintentar,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (consulta) => {
      if (!pestanaVisible()) return false
      const cita = consulta.state.data
      return cita?.estado === 'pendiente' || Boolean(cita?.propuestaCambioHora)
        ? 30_000
        : false
    },
  })
}

/**
 * Aceptar y rechazar responden con el detalle actualizado: se escribe en la
 * caché del detalle y se invalida el listado. Un 404/409 significa que la
 * propuesta ya no está vigente, así que también hay que volver a leer.
 */
function useCambioHora(
  mutacion: (id: number) => Promise<CitaClienteDetalle>,
) {
  const queryClient = useQueryClient()

  return useMutation<CitaClienteDetalle, unknown, number>({
    mutationFn: mutacion,
    onSuccess: (cita) => {
      queryClient.setQueryData(clavesCliente.cita(cita.id), cita)
      void queryClient.invalidateQueries({ queryKey: clavesCliente.citas })
    },
    onError: (error, id) => {
      if (
        error instanceof ErrorPeticion &&
        (error.status === 404 || error.status === 409)
      ) {
        void queryClient.invalidateQueries({ queryKey: clavesCliente.cita(id) })
        void queryClient.invalidateQueries({ queryKey: clavesCliente.citas })
      }
    },
  })
}

export function useAceptarCambioHora() {
  return useCambioHora(aceptarCambioHora)
}

export function useRechazarCambioHora() {
  return useCambioHora(rechazarCambioHora)
}

export function useAgregarBarberoCliente() {
  const queryClient = useQueryClient()

  return useMutation<VincularBarberoResponse, unknown, string>({
    mutationFn: vincularBarbero,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesCliente.barberos })
    },
  })
}

export function useActualizarPerfil() {
  const queryClient = useQueryClient()
  const { actualizarPerfil: actualizarPerfilSesion } = useAuth()

  return useMutation<PerfilCliente, unknown, ActualizarPerfilBody>({
    mutationFn: actualizarPerfil,
    onSuccess: (perfil) => {
      actualizarPerfilSesion(perfil)
      queryClient.setQueryData(clavesCliente.perfil, perfil)
    },
  })
}

export function useCambiarContrasena() {
  return useMutation<
    { ok: boolean },
    unknown,
    CambiarContrasenaBody
  >({
    mutationFn: cambiarContrasena,
  })
}

export function useCrearCitaCliente(codigo: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cuerpo: CrearCitaClienteBody) =>
      crearCitaCliente(codigo, cuerpo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesCliente.citas })
      void queryClient.invalidateQueries({ queryKey: clavesCliente.barberos })
    },
  })
}
