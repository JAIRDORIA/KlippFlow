import type { EstadoCita } from '../types'

/**
 * ¿Se sigue mostrando el aviso "Tienes una cita pendiente" en el link público?
 *
 * El aviso sale de una cita guardada en el navegador, así que hay que validarla
 * contra el servidor (`GET /public/citas/:token`). Se muestra solo mientras la
 * cita siga viva:
 *
 * - `pendiente`: el barbero todavía no responde.
 * - `aceptada`: la cita es de hoy o de un día futuro.
 *
 * `atendida`, `no_asistio`, `cancelada`, `rechazada` y `expirada` son estados
 * finales: el aviso se oculta y la cita guardada se olvida. Una cita `aceptada`
 * con fecha ya pasada también se considera terminada (el servicio ya se hizo).
 */

/** Estados en los que la cita sigue viva. */
export const ESTADOS_VIGENTES: readonly EstadoCita[] = ['pendiente', 'aceptada']

export interface DatosAvisoCita {
  estado: EstadoCita | string
  /** Fecha de la cita en Bogotá, `YYYY-MM-DD`. */
  fecha: string
}

function esVigentePorEstado(estado: string): boolean {
  return (ESTADOS_VIGENTES as readonly string[]).includes(estado)
}

/** `YYYY-MM-DD` compara bien como texto (mismo huso, formato ISO). */
function esFechaDeHoyOFutura(fecha: string, hoy: string): boolean {
  if (!fecha) return false
  return fecha >= hoy
}

export function debeMostrarAvisoCita(
  datos: DatosAvisoCita | null | undefined,
  hoy: string,
): boolean {
  if (!datos || !esVigentePorEstado(datos.estado)) return false

  // Una solicitud pendiente se muestra aunque el día ya haya pasado: el
  // servidor la marcará como expirada y entonces dejará de mostrarse.
  if (datos.estado === 'pendiente') return true

  return esFechaDeHoyOFutura(datos.fecha, hoy)
}

/**
 * ¿Podemos borrar la cita del almacenamiento? Solo con una respuesta definitiva:
 * estado final, cita aceptada de un día pasado o token que ya no existe (404).
 */
export function debeOlvidarCita(
  datos: DatosAvisoCita | null | undefined,
  hoy: string,
): boolean {
  if (!datos) return false
  return !debeMostrarAvisoCita(datos, hoy)
}
