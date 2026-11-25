import { useCallback, useEffect, useState } from 'react'

/**
 * Cuenta regresiva visual para "Reenviar código". El backend ya limita las
 * peticiones; esto evita que el cliente choque con el 429 por impaciencia.
 */
export function useCooldown(segundos = 60) {
  const [restantes, setRestantes] = useState(0)

  useEffect(() => {
    if (restantes <= 0) return
    const temporizador = window.setTimeout(
      () => setRestantes((actual) => Math.max(0, actual - 1)),
      1000,
    )
    return () => window.clearTimeout(temporizador)
  }, [restantes])

  const iniciar = useCallback(() => setRestantes(segundos), [segundos])

  return { restantes, activo: restantes > 0, iniciar }
}

/** 42 → "0:42". */
export function formatearCuentaRegresiva(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  return `${minutos}:${String(resto).padStart(2, '0')}`
}
