/**
 * Navegación hacia la pantalla de verificación de correo.
 *
 * El correo viaja en `location.state` y no en la URL, para no dejarlo en el
 * historial ni en los logs. Si falta (recarga en otro navegador, acceso
 * directo o login con username), la pantalla lo pide.
 */

export const RUTA_VERIFICACION = '/registro/verificar'

export interface EstadoVerificacion {
  correo?: string
  /** Mensaje del backend tras el registro ("Te enviamos un código…"). */
  mensaje?: string
  /** Llega desde un login rechazado con 403 por correo sin verificar. */
  desdeLogin?: boolean
}

export function rutaVerificacion(volver: string | null): string {
  if (!volver) return RUTA_VERIFICACION
  return `${RUTA_VERIFICACION}?${new URLSearchParams({ volver }).toString()}`
}

/** Lee `location.state` sin confiar en su forma. */
export function leerEstadoVerificacion(estado: unknown): EstadoVerificacion {
  if (typeof estado !== 'object' || estado === null) return {}
  const datos = estado as Record<string, unknown>
  return {
    correo: typeof datos.correo === 'string' ? datos.correo : undefined,
    mensaje: typeof datos.mensaje === 'string' ? datos.mensaje : undefined,
    desdeLogin: datos.desdeLogin === true,
  }
}

/** Si el cliente escribió un correo en el login, se precarga; un username no sirve. */
export function correoDesdeIdentificador(identificador: string): string | undefined {
  const limpio = identificador.trim().toLowerCase()
  return limpio.includes('@') ? limpio : undefined
}
