/**
 * Rutas internas seguras para el parámetro `volver` y ruta inicial por rol.
 * No dependen del router: son lógica pura y se prueban sin navegador.
 */

export type TipoSesion = 'barbero' | 'cliente'

const BASE_SEGURA = 'https://klippflow.invalid'
/** Rutas internas del panel del barbero. */
const RUTAS_BARBERO = [/^\/dashboard\/?$/, /^\/app(\/|$)/, /^\/instalar$/]

/** Rutas internas del cliente. */
const RUTAS_CLIENTE = [/^\/mi$/, /^\/mi\//, /^\/b\//, /^\/cita\//]

/**
 * Destinos internos aceptados por `volver` en el login unificado. Incluye el
 * panel del barbero (`/dashboard` y `/app/*`) para que un enlace profundo de
 * WhatsApp conserve su destino tras el login. Quedan fuera `/admin`, `/login` y
 * cualquier URL con origen externo.
 */
const RUTAS_PERMITIDAS = [...RUTAS_BARBERO, ...RUTAS_CLIENTE]

function esRutaPermitida(
  pathname: string,
  permitidas: readonly RegExp[],
): boolean {
  return permitidas.some((patron) => patron.test(pathname))
}

/**
 * ¿El destino pertenece al panel del barbero? Se usa para abrir el login en la
 * pestaña correcta cuando el enlace profundo viene de un aviso de WhatsApp.
 */
export function esRutaDeBarbero(ruta: string | null | undefined): boolean {
  if (typeof ruta !== 'string') return false

  const [crudo = ''] = ruta.trim().split(/[?#]/)
  const pathname = crudo.replace(/\/+$/, '') || '/'
  return (
    pathname === '/dashboard' ||
    pathname === '/instalar' ||
    pathname === '/app' ||
    pathname.startsWith('/app/')
  )
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
 * Acepta solo una "/" inicial y las rutas internas de la lista indicada.
 * Nunca devuelve URLs externas.
 */
function destinoSeguro(
  ruta: string | null | undefined,
  permitidas: readonly RegExp[],
): string | null {
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

  if (!esRutaPermitida(pathname, permitidas)) return null

  return `${url.pathname}${url.search}`
}

/**
 * Destino seguro del login unificado: panel del barbero (/dashboard, /app/*,
 * /instalar) o zona del cliente (/b/*, /cita/*, /mi o /mi/*).
 */
export function volverSeguro(ruta: string | null | undefined): string | null {
  return destinoSeguro(ruta, RUTAS_PERMITIDAS)
}

/**
 * Destino seguro para los push del cliente: solo su zona. Así un payload
 * ajeno (`/app/hoy`, `/admin`…) no puede abrir el panel del barbero.
 */
export function volverClienteSeguro(
  ruta: string | null | undefined,
): string | null {
  return destinoSeguro(ruta, RUTAS_CLIENTE)
}

export function rutaInicialPorRol(tipo: TipoSesion | null | undefined): string {
  if (tipo === 'barbero') return '/app'
  if (tipo === 'cliente') return '/mi'
  return '/login'
}
