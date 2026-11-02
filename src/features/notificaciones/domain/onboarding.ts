import type { PermisoNotificaciones } from '../types'
import type { Plataforma } from './plataforma'

/**
 * Decisión de qué pantalla mostrar después del login y política de
 * "Hacerlo después".
 *
 * - Nunca se ofrece si el permiso ya está concedido o denegado: no hay nada que
 *   hacer o el navegador ya no volverá a preguntar.
 * - "Hacerlo después" guarda la fecha; se vuelve a ofrecer pasadas 24 h.
 * - En iPhone sin instalar se muestra el onboarding completo (pasos + permiso).
 * - En el resto (Android, escritorio, iPhone ya instalado) solo la activación.
 */

export const CLAVE_DESCARTE = 'klippflow.onboarding.instalacion'
export const HORAS_DESCARTE = 24

const MS_POR_HORA = 3_600_000

export type DecisionOnboarding = 'completo' | 'solo_notificaciones' | 'nada'

export interface EntradaDecisionOnboarding {
  plataforma: Plataforma
  standalone: boolean
  permiso: PermisoNotificaciones
  /** Fecha ISO de "Hacerlo después", o null si nunca se descartó. */
  descartadoEn: string | null
  ahora: Date
}

/** true si se descartó hace menos de 24 h. */
export function descarteVigente(descartadoEn: string | null, ahora: Date): boolean {
  if (!descartadoEn) return false

  const fecha = new Date(descartadoEn)
  const instante = fecha.getTime()
  if (Number.isNaN(instante)) return false

  const transcurrido = ahora.getTime() - instante
  return transcurrido >= 0 && transcurrido < HORAS_DESCARTE * MS_POR_HORA
}

export function decidirOnboarding(
  entrada: EntradaDecisionOnboarding,
): DecisionOnboarding {
  if (entrada.permiso === 'granted' || entrada.permiso === 'denied') return 'nada'
  if (descarteVigente(entrada.descartadoEn, entrada.ahora)) return 'nada'

  if (entrada.plataforma === 'ios' && !entrada.standalone) return 'completo'
  return 'solo_notificaciones'
}

export interface AlmacenDescarte {
  getItem: (clave: string) => string | null
  setItem: (clave: string, valor: string) => void
  removeItem: (clave: string) => void
}

/** Fecha ISO guardada, o null si no hay o está corrupta. */
export function leerDescarte(
  almacen: AlmacenDescarte | null,
  clave: string = CLAVE_DESCARTE,
): string | null {
  if (!almacen) return null

  try {
    const crudo = almacen.getItem(clave)
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos === 'string') return datos
    if (typeof datos === 'object' && datos !== null) {
      const valor = (datos as Record<string, unknown>).descartadoEn
      return typeof valor === 'string' ? valor : null
    }
    return null
  } catch {
    return null
  }
}

export function guardarDescarte(
  almacen: AlmacenDescarte | null,
  ahora: Date = new Date(),
  clave: string = CLAVE_DESCARTE,
): void {
  if (!almacen) return

  try {
    almacen.setItem(clave, JSON.stringify({ descartadoEn: ahora.toISOString() }))
  } catch {
    // Sin almacenamiento (modo privado lleno): el onboarding simplemente
    // vuelve a ofrecerse en la próxima sesión.
  }
}

export function borrarDescarte(
  almacen: AlmacenDescarte | null,
  clave: string = CLAVE_DESCARTE,
): void {
  if (!almacen) return
  try {
    almacen.removeItem(clave)
  } catch {
    // Nada que hacer.
  }
}

/** `localStorage` del navegador, si existe. */
export function almacenDelNavegador(): AlmacenDescarte | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}
