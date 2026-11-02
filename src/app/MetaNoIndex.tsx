import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { esRutaNoIndex } from './rutas'

/**
 * Garantiza `<meta name="robots" content="noindex">` en las rutas que no deben
 * indexarse (privadas y reservas públicas). La decisión vive en `rutas.ts`.
 *
 * `index.html` ya trae `noindex, nofollow` para toda la app; este componente lo
 * refuerza por ruta y lo restaura al desmontarse.
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
