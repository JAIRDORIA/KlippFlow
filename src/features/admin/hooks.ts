import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import { useAdminAuth } from '@/features/auth/useAdminAuth'
import type { CredencialesLogin } from '@/features/auth/types'
import {
  cambiarEstadoBarbero,
  crearBarbero,
  listarBarberos,
  restablecerPasswordBarbero,
  rotarCodigoBarbero,
} from './api'
import { clavesAdmin } from './claves'
import type {
  BarberoAdmin,
  CrearBarberoBody,
  EstadoCuenta,
  ListaBarberos,
} from './types'

/** El backend admite como máximo 50 por página. */
export const LIMITE_BARBEROS = 50

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

function esErrorDeEstado(error: unknown): boolean {
  return (
    error instanceof ErrorPeticion && (error.status === 404 || error.status === 409)
  )
}

export function useAdminLogin() {
  const { login } = useAdminAuth()

  return useMutation({
    mutationFn: (credenciales: CredencialesLogin) => login(credenciales),
  })
}

/**
 * Lista completa (hasta 50) para poder contar por estado y buscar por nombre en
 * el cliente: el backend solo filtra por `username` y `nombre_barberia` y no
 * devuelve conteos.
 */
export function useBarberos() {
  return useQuery<ListaBarberos>({
    queryKey: clavesAdmin.barberos,
    queryFn: () => listarBarberos({ pagina: 1, limite: LIMITE_BARBEROS }),
    staleTime: 15_000,
    retry: reintentar,
  })
}

/** Invalida la lista y relee si el barbero ya no existe o hubo conflicto. */
function useInvalidarBarberos() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: clavesAdmin.barberos })
  }
}

export function useCrearBarbero() {
  const invalidar = useInvalidarBarberos()

  return useMutation<BarberoAdmin, unknown, CrearBarberoBody>({
    mutationFn: (cuerpo) => crearBarbero(cuerpo),
    onSuccess: invalidar,
    onError: (error) => {
      if (esErrorDeEstado(error)) invalidar()
    },
  })
}

export function useCambiarEstado() {
  const invalidar = useInvalidarBarberos()

  return useMutation<unknown, unknown, { id: number; estado: EstadoCuenta }>({
    mutationFn: ({ id, estado }) => cambiarEstadoBarbero(id, { estado }),
    onSuccess: invalidar,
    onError: (error) => {
      if (esErrorDeEstado(error)) invalidar()
    },
  })
}

export function useRotarCodigo() {
  const invalidar = useInvalidarBarberos()

  return useMutation({
    mutationFn: (id: number) => rotarCodigoBarbero(id),
    onSuccess: invalidar,
    onError: (error) => {
      if (esErrorDeEstado(error)) invalidar()
    },
  })
}

export function useRestablecerClave() {
  const invalidar = useInvalidarBarberos()

  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      restablecerPasswordBarbero(id, password),
    onSuccess: invalidar,
    onError: (error) => {
      if (esErrorDeEstado(error)) invalidar()
    },
  })
}
