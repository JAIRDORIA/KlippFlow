import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { ErrorPeticion } from '@/shared/api/client'
import {
  eliminarPasskey,
  listarPasskeys,
  obtenerOpcionesLogin,
  obtenerOpcionesRegistro,
  verificarLogin,
  verificarRegistro,
} from './api'
import {
  autenticadorPlataformaDisponible,
  soportaPasskeys,
} from './domain/passkeys'
import {
  borrarMarcaPasskey,
  guardarMarcaPasskey,
} from './domain/marca'
import type {
  PasskeyCliente,
  RegistroPasskeyResponse,
  RespuestaLoginPasskey,
} from './types'

export const clavesPasskeys = {
  lista: ['cliente', 'passkeys'] as const,
}

export function usePasskeysCliente() {
  const { tipo } = useAuth()

  return useQuery<PasskeyCliente[]>({
    queryKey: clavesPasskeys.lista,
    queryFn: listarPasskeys,
    enabled: tipo === 'cliente',
    staleTime: 30_000,
  })
}

export function useEliminarPasskey() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, number>({
    mutationFn: eliminarPasskey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesPasskeys.lista })
    },
  })
}

export interface DatosRegistroPasskey {
  nombre: string
}

/**
 * Opciones y desafioToken viven solo en el cierre de `mutationFn`.
 * Nunca se guardan en variables de la mutación, storage, URL ni caché.
 */
export function useRegistrarPasskey() {
  const queryClient = useQueryClient()

  return useMutation<RegistroPasskeyResponse, unknown, DatosRegistroPasskey>({
    mutationFn: async ({ nombre }) => {
      const { opciones, desafioToken } = await obtenerOpcionesRegistro()
      const respuesta = await startRegistration({ optionsJSON: opciones })

      return verificarRegistro({
        desafioToken,
        respuesta,
        nombre: nombre.trim() || undefined,
      })
    },
    onSuccess: () => {
      guardarMarcaPasskey()
      void queryClient.invalidateQueries({ queryKey: clavesPasskeys.lista })
    },
  })
}

/** Login descubrible: no usa usuario; el backend devuelve la sesión de cliente. */
export function useLoginPasskey() {
  const { iniciarSesion } = useAuth()

  return useMutation<RespuestaLoginPasskey, unknown, void>({
    mutationFn: async () => {
      const { opciones, desafioToken } = await obtenerOpcionesLogin()
      const respuesta = await startAuthentication({ optionsJSON: opciones })

      try {
        return await verificarLogin({ desafioToken, respuesta })
      } catch (error) {
        // 401: la credencial ya no sirve en este dispositivo.
        if (error instanceof ErrorPeticion && error.status === 401) {
          borrarMarcaPasskey()
        }
        throw error
      }
    },
    onSuccess: (respuesta) => {
      iniciarSesion(respuesta)
      guardarMarcaPasskey()
    },
  })
}

/**
 * Solo para decidir si ofrecer creación. `null` mientras se comprueba.
 * El botón de login no depende de esta comprobación.
 */
export function useAutenticadorPlataforma(): boolean | null {
  const [disponible, setDisponible] = useState<boolean | null>(() =>
    soportaPasskeys() ? null : false,
  )

  useEffect(() => {
    if (!soportaPasskeys()) return

    let vigente = true
    void autenticadorPlataformaDisponible().then((resultado) => {
      if (vigente) setDisponible(resultado)
    })

    return () => {
      vigente = false
    }
  }, [])

  return disponible
}
