import type { CitaGuardada } from './types'

/**
 * Citas guardadas por el cliente. Solo se guarda lo mínimo para volver al
 * seguimiento; nunca nombre, celular ni correo.
 */
export const CLAVE_CITAS_CLIENTE = 'klippflow.citasCliente'
export const MAXIMO_CITAS_GUARDADAS = 5

function obtenerAlmacen(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function esCitaGuardada(valor: unknown): valor is CitaGuardada {
  if (typeof valor !== 'object' || valor === null) return false
  const cita = valor as Record<string, unknown>
  if (typeof cita.token !== 'string' || cita.token.trim() === '') return false
  if (typeof cita.codigo !== 'string' || cita.codigo.trim() === '') return false
  if (typeof cita.creadoEn !== 'string') return false
  return !Number.isNaN(Date.parse(cita.creadoEn))
}

/** Lista tolerante a localStorage bloqueado, JSON corrupto y datos inválidos. */
export function leerCitasGuardadas(): CitaGuardada[] {
  const almacen = obtenerAlmacen()
  if (!almacen) return []

  try {
    const crudo = almacen.getItem(CLAVE_CITAS_CLIENTE)
    if (!crudo) return []

    const datos: unknown = JSON.parse(crudo)
    if (!Array.isArray(datos)) return []

    const validas = datos.filter(esCitaGuardada)
    const ordenadas = [...validas].sort(
      (a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn),
    )

    const unicas: CitaGuardada[] = []
    const tokens = new Set<string>()
    for (const cita of ordenadas) {
      if (tokens.has(cita.token)) continue
      tokens.add(cita.token)
      unicas.push(cita)
      if (unicas.length === MAXIMO_CITAS_GUARDADAS) break
    }
    return unicas
  } catch {
    return []
  }
}

/** Guarda al inicio, sin duplicar token y con máximo de 5. Nunca lanza. */
export function guardarCitaCliente(cita: CitaGuardada): void {
  const almacen = obtenerAlmacen()
  if (!almacen) return

  try {
    const actuales = leerCitasGuardadas().filter(
      (guardada) => guardada.token !== cita.token,
    )
    const nuevas = [cita, ...actuales]
      .sort((a, b) => Date.parse(b.creadoEn) - Date.parse(a.creadoEn))
      .slice(0, MAXIMO_CITAS_GUARDADAS)
    almacen.setItem(CLAVE_CITAS_CLIENTE, JSON.stringify(nuevas))
  } catch {
    // Modo privado o cuota llena: la reserva sigue funcionando sin historial.
  }
}

export function obtenerCitaActivaDeCodigo(codigo: string): CitaGuardada | null {
  const normalizado = codigo.trim().toUpperCase()
  return (
    leerCitasGuardadas().find((cita) => cita.codigo.toUpperCase() === normalizado) ??
    null
  )
}

export function obtenerCitaGuardadaPorToken(token: string): CitaGuardada | null {
  return leerCitasGuardadas().find((cita) => cita.token === token) ?? null
}
