import { useEffect, useState } from 'react'

/**
 * Reloj de interfaz con el intervalo indicado.
 *
 * Se usa para la cuenta regresiva de las solicitudes (cada 30 s, sin volver a
 * pedir datos) y para recalcular el saludo y el eyebrow de Hoy cuando cambia
 * el día con la app abierta. Al volver a la pestaña se sincroniza de inmediato.
 */
export function useAhora(intervaloMs: number): number {
  const [ahora, setAhora] = useState<number>(() => Date.now())

  useEffect(() => {
    function actualizar(): void {
      setAhora(Date.now())
    }

    function alCambiarVisibilidad(): void {
      if (document.visibilityState === 'visible') actualizar()
    }

    const temporizador = window.setInterval(actualizar, intervaloMs)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      window.clearInterval(temporizador)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [intervaloMs])

  return ahora
}
