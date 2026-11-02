import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import { clavesBalance } from '@/features/cuentas/claves'
import type { Balance } from '@/features/cuentas/types'
import { crearCompra, editarCompra, eliminarCompra, obtenerCompras } from './api'
import { clavesCompras } from './claves'
import type { CrearCompraBody, EditarCompraBody } from './types'

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

/** Un 409/404 significa que la compra ya no es de hoy: hay que releer. */
export function esCambioDeEstado(error: unknown): boolean {
  return (
    error instanceof ErrorPeticion && (error.status === 409 || error.status === 404)
  )
}

function useInvalidacion(fecha: string) {
  const queryClient = useQueryClient()

  const invalidarTodo = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: clavesCompras.lista(fecha) })
    void queryClient.invalidateQueries({ queryKey: clavesBalance.hoy(fecha) })
    void queryClient.invalidateQueries({ queryKey: clavesBalance.historial(fecha) })
  }, [queryClient, fecha])

  return { queryClient, invalidarTodo }
}

/** Compras del día (por defecto hoy). */
export function useCompras(fecha: string) {
  return useQuery({
    queryKey: clavesCompras.lista(fecha),
    queryFn: () => obtenerCompras(fecha),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: reintentar,
  })
}

export function useCrearCompra(fecha: string) {
  const { queryClient, invalidarTodo } = useInvalidacion(fecha)

  return useMutation({
    mutationFn: (cuerpo: CrearCompraBody) => crearCompra(cuerpo),
    onSuccess: (respuesta) => {
      // El POST devuelve el balance actualizado: se adelanta en la caché.
      queryClient.setQueryData<Balance>(clavesBalance.hoy(fecha), respuesta.balance)
      invalidarTodo()
    },
  })
}

export function useEditarCompra(fecha: string) {
  const { queryClient, invalidarTodo } = useInvalidacion(fecha)

  return useMutation({
    mutationFn: ({ id, cambios }: { id: number; cambios: EditarCompraBody }) =>
      editarCompra(id, cambios),
    onSuccess: (respuesta) => {
      queryClient.setQueryData<Balance>(clavesBalance.hoy(fecha), respuesta.balance)
      invalidarTodo()
    },
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidarTodo()
    },
  })
}

export function useEliminarCompra(fecha: string) {
  const { invalidarTodo } = useInvalidacion(fecha)

  return useMutation({
    mutationFn: (id: number) => eliminarCompra(id),
    // DELETE responde 204: no trae balance, se relee al invalidar.
    onSuccess: invalidarTodo,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidarTodo()
    },
  })
}
