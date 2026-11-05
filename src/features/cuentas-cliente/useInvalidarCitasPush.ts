import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { clavesCliente } from './hooks'

interface MensajePush {
  tipo?: unknown
}

/**
 * El service worker avisa al mostrar un push de cliente. Invalida la lista y el
 * detalle de citas para que el cambio de estado se vea sin recargar.
 */
export function useInvalidarCitasPush(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    function alRecibir(evento: MessageEvent<unknown>) {
      if (typeof evento.data !== 'object' || evento.data === null) return
      const mensaje = evento.data as MensajePush
      if (mensaje.tipo !== 'push-cliente') return

      void queryClient.invalidateQueries({ queryKey: clavesCliente.citas })
    }

    navigator.serviceWorker.addEventListener('message', alRecibir)
    return () => {
      navigator.serviceWorker.removeEventListener('message', alRecibir)
    }
  }, [queryClient])
}
