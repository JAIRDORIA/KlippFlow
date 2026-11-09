import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorPeticion } from '@/shared/api/client'
import { clavesConsulta } from '@/features/agenda/claves'
import {
  actualizarWhatsapp,
  editarServicio,
  crearHorario,
  crearServicio,
  desactivarServicio,
  editarHorario,
  eliminarHorario,
  obtenerConfiguracion,
  obtenerHorarios,
  obtenerServicios,
  reactivarServicio,
} from './api'
import { clavesAjustes } from './claves'
import { planificarGuardado, type DiaBorrador } from './domain/horarios'
import type {
  ActualizarWhatsappBody,
  Configuracion,
  CrearServicioBody,
  EditarServicioBody,
  Horario,
  RespuestaWhatsapp,
  Servicio,
} from './types'

function reintentar(intentos: number, error: unknown): boolean {
  if (error instanceof ErrorPeticion && error.status >= 400 && error.status < 500) {
    return false
  }
  return intentos < 1
}

/** 404/409 significan que el servidor cambió: hay que releer. */
export function esCambioDeEstado(error: unknown): boolean {
  return (
    error instanceof ErrorPeticion && (error.status === 409 || error.status === 404)
  )
}

export function useConfiguracion() {
  return useQuery({
    queryKey: clavesAjustes.configuracion,
    queryFn: obtenerConfiguracion,
    staleTime: 5 * 60_000,
    retry: reintentar,
  })
}

/**
 * Guarda el consentimiento de WhatsApp del barbero. La respuesta trae el
 * `whatsapp` normalizado, así que se adelanta la caché y además se invalida la
 * configuración para que el link y la tarjeta queden coherentes.
 */
export function useActualizarWhatsapp() {
  const queryClient = useQueryClient()

  return useMutation<RespuestaWhatsapp, unknown, ActualizarWhatsappBody>({
    mutationFn: actualizarWhatsapp,
    onSuccess: (respuesta) => {
      queryClient.setQueryData<Configuracion>(
        clavesAjustes.configuracion,
        (actual) =>
          actual ? { ...actual, whatsapp: respuesta.whatsapp } : actual,
      )
      void queryClient.invalidateQueries({
        queryKey: clavesAjustes.configuracion,
      })
    },
  })
}

/** Servicios del barbero, incluidos los inactivos. */
export function useServicios() {
  return useQuery({
    queryKey: clavesAjustes.servicios,
    queryFn: obtenerServicios,
    staleTime: 30_000,
    retry: reintentar,
  })
}

export function useHorarios() {
  return useQuery({
    queryKey: clavesAjustes.horarios,
    queryFn: obtenerHorarios,
    staleTime: 30_000,
    retry: reintentar,
  })
}

function useInvalidarServicios() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: clavesAjustes.servicios })
  }, [queryClient])
}

export function useCrearServicio() {
  const invalidar = useInvalidarServicios()
  return useMutation({
    mutationFn: (cuerpo: CrearServicioBody) => crearServicio(cuerpo),
    onSuccess: invalidar,
  })
}

export function useEditarServicio() {
  const invalidar = useInvalidarServicios()
  return useMutation({
    mutationFn: ({ id, cambios }: { id: number; cambios: EditarServicioBody }) =>
      editarServicio(id, cambios),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

/** Borrado lógico: `activo = false`. */
export function useDesactivarServicio() {
  const invalidar = useInvalidarServicios()
  return useMutation({
    mutationFn: (id: number) => desactivarServicio(id),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export function useReactivarServicio() {
  const invalidar = useInvalidarServicios()
  return useMutation({
    mutationFn: (id: number) => reactivarServicio(id),
    onSuccess: invalidar,
    onError: (error) => {
      if (esCambioDeEstado(error)) invalidar()
    },
  })
}

export interface CambiosDiaHorario {
  dia: DiaBorrador
  servidor: readonly Horario[]
}

/**
 * Guarda un día completo: traduce el borrador a POST/PATCH/DELETE y los
 * ejecuta en orden. Al terminar invalida horarios y el dashboard de Hoy,
 * porque los bloques cambian `bloquesDeTrabajo` y `huecosLibres`.
 */
export function useGuardarDiaHorario() {
  const queryClient = useQueryClient()

  const invalidar = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: clavesAjustes.horarios })
    void queryClient.invalidateQueries({ queryKey: clavesConsulta.dashboardHoy })
  }, [queryClient])

  return useMutation({
    mutationFn: async ({ dia, servidor }: CambiosDiaHorario) => {
      const operaciones = planificarGuardado(dia, servidor)

      for (const operacion of operaciones) {
        if (operacion.tipo === 'crear') {
          await crearHorario({
            diaSemana: operacion.diaSemana,
            horaInicio: operacion.horaInicio,
            horaFin: operacion.horaFin,
            activo: operacion.activo,
          })
        } else if (operacion.tipo === 'editar') {
          await editarHorario(operacion.id, operacion.cambios)
        } else {
          await eliminarHorario(operacion.id)
        }
      }

      return operaciones.length
    },
    onSuccess: invalidar,
    // Un guardado por día puede quedar a medias: se relee para que
    // "Descartar" parta de un estado coherente con el servidor.
    onError: invalidar,
  })
}

export type { Servicio }
