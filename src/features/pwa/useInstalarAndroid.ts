import { useCallback, useEffect, useState } from 'react'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstalacionAndroid {
  puedeInstalar: boolean
  instalar: () => Promise<'accepted' | 'dismissed' | null>
}

/**
 * Captura `beforeinstallprompt` en Android/Chrome. Sin ese evento no se muestra
 * ningún botón: el navegador no ofrece instalación directa.
 */
export function useInstalarAndroid(): InstalacionAndroid {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)

  useEffect(() => {
    function alPoderInstalar(eventoNativo: Event) {
      eventoNativo.preventDefault()
      setEvento(eventoNativo as EventoInstalacion)
    }

    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar)
  }, [])

  const instalar = useCallback(async (): Promise<
    'accepted' | 'dismissed' | null
  > => {
    if (!evento) return null

    await evento.prompt()
    const eleccion = await evento.userChoice
    if (eleccion.outcome === 'accepted') setEvento(null)
    return eleccion.outcome
  }, [evento])

  return { puedeInstalar: evento !== null, instalar }
}
