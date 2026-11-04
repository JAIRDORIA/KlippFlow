/**
 * Rutas internas seguras para el parámetro `volver` y ruta inicial por rol.
 * No dependen del router: son lógica pura y se prueban sin navegador.
 */

export type TipoSesion = 'barbero' | 'cliente'

const BASE_SEGURA = 'https://klippflow.invalid'
const RUTAS_PERMITIDAS = [/^\/mi$/, /^\/mi\//, /^\/b\//, /^\/cita\//]

function esRutaPermitida(pathname: string): boolean {
  return RUTAS_PERMITIDAS.some((patron) => patron.test(pathname))
}

function tieneControles(valor: string): boolean {
  for (const caracter of valor) {
    const codigo = caracter.charCodeAt(0)
    if (codigo < 32 || codigo === 127) return true
  }
  return false
}

/**
 * Devuelve la ruta si es un destino interno permitido o `null`.
 * Acepta solo una "/" inicial y rutas /b/*, /cita/*, /mi o /mi/*.
 */
export function volverSeguro(ruta: string | null | undefined): string | null {
  if (typeof ruta !== 'string') return null
  if (ruta.includes('\\') || tieneControles(ruta)) return null

  const valor = ruta.trim()
  if (!valor.startsWith('/')) return null
  if (valor.startsWith('//')) return null

  let url: URL
  try {
    url = new URL(valor, BASE_SEGURA)
  } catch {
    return null
  }

  if (url.origin !== BASE_SEGURA) return null

  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return null
  }

  if (!pathname.startsWith('/') || pathname.startsWith('//')) return null
  if (pathname.includes('\\') || tieneControles(pathname)) return null

  const segmentos = pathname.split('/')
  if (segmentos.some((segmento) => segmento === '.' || segmento === '..')) {
    return null
  }

  if (!esRutaPermitida(pathname)) return null

  return `${url.pathname}${url.search}`
}

export function rutaInicialPorRol(tipo: TipoSesion | null | undefined): string {
  if (tipo === 'barbero') return '/app'
  if (tipo === 'cliente') return '/mi'
  return '/login'
}
