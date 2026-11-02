import { useEffect, useState } from 'react'

/** Estado de conexión del navegador, actualizado con los eventos online/offline. */
export function useSinConexion(): boolean {
  const [sinConexion, setSinConexion] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? false : navigator.onLine === false,
  )

  useEffect(() => {
    function alDesconectar() {
      setSinConexion(true)
    }
    function alConectar() {
      setSinConexion(false)
    }

    window.addEventListener('offline', alDesconectar)
    window.addEventListener('online', alConectar)

    return () => {
      window.removeEventListener('offline', alDesconectar)
      window.removeEventListener('online', alConectar)
    }
  }, [])

  return sinConexion
}
