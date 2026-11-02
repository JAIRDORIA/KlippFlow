import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { tituloDeRuta, type OpcionesTitulo } from './rutas'

/**
 * Título del documento según la ruta actual.
 *
 * Se llama una vez por pantalla (o en el layout de la zona) y toma el mapeo de
 * `rutas.ts`, que también decide el `noindex`. En la reserva pública se le pasa
 * el nombre de la barbería cuando ya cargó.
 */
export function useTituloPagina(opciones: OpcionesTitulo = {}): void {
  const { pathname } = useLocation()
  const titulo = tituloDeRuta(pathname, opciones)

  useEffect(() => {
    document.title = titulo
  }, [titulo])
}
