import { useEffect, useState } from 'react'

/** Retrasa un valor para agrupar cambios seguidos en una sola consulta. */
export function useDebouncedValue<T>(valor: T, milisegundos: number): T {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const temporizador = window.setTimeout(() => setDebounced(valor), milisegundos)
    return () => window.clearTimeout(temporizador)
  }, [valor, milisegundos])

  return debounced
}
