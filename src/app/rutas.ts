/**
 * Estructura de rutas de la app en un solo lugar: zona, título del documento y
 * decisión de `noindex`.
 *
 * Se usa desde `ZoneRouter` (zona), `useTituloPagina` (título) y `MetaNoIndex`
 * (`noindex`), para que las tres cosas no se desincronicen.
 */

export type Zona = 'barbero' | 'publico' | 'admin' | 'desconocida'

/** Quita barras finales y deja `/` cuando la ruta queda vacía. */
export function normalizarRuta(pathname: string): string {
  const sinBarras = pathname.replace(/\/+$/, '')
  return sinBarras === '' ? '/' : sinBarras
}

/** Zona a la que pertenece una ruta (misma lógica que usan los guards). */
export function zonaDeRuta(pathname: string): Zona {
  const ruta = normalizarRuta(pathname)

  if (
    ruta === '/login' ||
    ruta === '/instalar' ||
    ruta === '/app' ||
    ruta.startsWith('/app/')
  ) {
    return 'barbero'
  }

  if (
    ruta === '/b' ||
    ruta.startsWith('/b/') ||
    ruta.startsWith('/cita/') ||
    ruta === '/mi' ||
    ruta.startsWith('/mi/') ||
    ruta === '/registro/completar' ||
    ruta === '/privacidad'
  ) {
    return 'publico'
  }

  if (ruta === '/admin' || ruta.startsWith('/admin/')) return 'admin'

  return 'desconocida'
}

const SUFIJO = 'KlippFlow'

/** Rutas que muestran el seguimiento público de una cita. */
function esSeguimiento(ruta: string): boolean {
  return ruta.startsWith('/cita/')
}

/** Rutas de la reserva pública (`/b` y `/b/:codigo`). */
function esReservaPublica(ruta: string): boolean {
  return ruta === '/b' || ruta.startsWith('/b/')
}

export interface OpcionesTitulo {
  /** Nombre de la barbería, solo en la reserva pública cuando ya cargó. */
  barberia?: string | null
}

/**
 * Título del documento por ruta: "Hoy · KlippFlow", "Reservar cita · KlippFlow"…
 * Cualquier ruta no listada es la 404.
 */
export function tituloDeRuta(
  pathname: string,
  opciones: OpcionesTitulo = {},
): string {
  const ruta = normalizarRuta(pathname)

  if (ruta === '/') return SUFIJO
  if (ruta === '/login') return `Entrar · ${SUFIJO}`
  if (ruta === '/instalar' || ruta === '/app/instalar') return `Instalar · ${SUFIJO}`
  if (ruta === '/dev') return `Kit visual · ${SUFIJO}`

  if (ruta === '/privacidad') return 'Política de privacidad de KlippFlow'
  if (ruta === '/mi') return `Mi cuenta · ${SUFIJO}`
  if (ruta === '/mi/instalar') return `Instalar · ${SUFIJO}`
  if (ruta === '/mi/citas') return `Mis citas · ${SUFIJO}`
  if (ruta.startsWith('/mi/citas/')) return `Detalle de cita · ${SUFIJO}`
  if (ruta === '/mi/seguridad') return `Seguridad · ${SUFIJO}`
  if (ruta === '/mi/nueva-contrasena') return `Nueva contraseña · ${SUFIJO}`
  if (ruta === '/registro/completar') return `Completa tu cuenta de cliente · ${SUFIJO}`

  if (ruta === '/app' || ruta === '/app/hoy') return `Hoy · ${SUFIJO}`
  if (ruta === '/app/solicitudes') return `Solicitudes · ${SUFIJO}`
  if (ruta === '/app/cuentas') return `Cuentas · ${SUFIJO}`
  if (ruta === '/app/compras') return `Compras · ${SUFIJO}`
  if (ruta === '/app/ajustes') return `Ajustes · ${SUFIJO}`

  if (ruta === '/admin' || ruta.startsWith('/admin/')) {
    return `Administración · ${SUFIJO}`
  }

  if (esSeguimiento(ruta)) return `Tu cita · ${SUFIJO}`

  if (esReservaPublica(ruta)) {
    const barberia = opciones.barberia?.trim()
    return barberia
      ? `Reservar cita · ${barberia} · ${SUFIJO}`
      : `Reservar cita · ${SUFIJO}`
  }

  return `No encontrada · ${SUFIJO}`
}

/** Rutas que exigen sesión o son herramientas internas del barbero/admin. */
export const PREFIJOS_PRIVADOS = [
  '/app',
  '/admin',
  '/login',
  '/instalar',
  '/mi',
  '/registro',
] as const

/**
 * Rutas públicas que tampoco se indexan: no queremos que Google liste a cada
 * barbero por su código ni las citas de los clientes.
 */
export const PREFIJOS_PUBLICOS_NO_INDEXABLES = ['/b', '/cita'] as const

function coincideAlgunPrefijo(
  ruta: string,
  prefijos: readonly string[],
): boolean {
  return prefijos.some(
    (prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`),
  )
}

/**
 * ¿Esta ruta lleva `<meta name="robots" content="noindex">`?
 *
 * Privadas (`/app/*`, `/admin/*`, login e instalar), públicas de reserva
 * (`/b/*`, `/cita/*`) y rutas desconocidas. `/privacidad` es la única excepción
 * indexable.
 */
export function esRutaNoIndex(pathname: string): boolean {
  const ruta = normalizarRuta(pathname)
  if (ruta === '/privacidad') return false

  return (
    zonaDeRuta(ruta) === 'desconocida' ||
    coincideAlgunPrefijo(ruta, PREFIJOS_PRIVADOS) ||
    coincideAlgunPrefijo(ruta, PREFIJOS_PUBLICOS_NO_INDEXABLES)
  )
}
