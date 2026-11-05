import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { esRutaNoIndex } from './rutas'

/**
 * Garantiza `<meta name="robots" content="noindex">` en las rutas que no deben
 * indexarse (privadas, reservas públicas y 404). La decisión vive en `rutas.ts`.
 *
 * `/privacidad` es la excepción indexable; no recibe este meta.
 */
export function MetaNoIndex() {
  const { pathname } = useLocation()
  const aplica = esRutaNoIndex(pathname)

  useEffect(() => {
    if (!aplica) return

    const existente = document.head.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    )
    if (existente?.getAttribute('content')?.includes('noindex')) return

    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)

    return () => {
      meta.remove()
    }
  }, [aplica])

  return null
}
