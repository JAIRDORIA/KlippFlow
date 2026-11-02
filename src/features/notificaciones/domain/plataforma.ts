/**
 * Detección de plataforma y de modo instalado.
 *
 * Reglas (docs de Apple y del prompt 6):
 * - En iPhone/iPad las notificaciones push solo existen con la PWA **instalada**
 *   y iOS 16.4 o superior (sin `PushManager` no hay soporte).
 * - iPadOS 13+ se identifica como Mac en el `userAgent`; se distingue por
 *   `maxTouchPoints > 1`.
 */

export type Plataforma = 'ios' | 'android' | 'escritorio'

export interface EntornoDispositivo {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
  /** `navigator.standalone` (Safari en iOS). */
  standalone?: boolean
  /** Simulación de `window.matchMedia('(display-mode: standalone)').matches`. */
  matchMedia?: (consulta: string) => boolean
  tieneServiceWorker?: boolean
  tienePushManager?: boolean
  tieneNotification?: boolean
}

export interface DeteccionDispositivo {
  plataforma: Plataforma
  standalone: boolean
  soportePush: boolean
}

export function esIos(entorno: EntornoDispositivo): boolean {
  if (/iPhone|iPad|iPod/i.test(entorno.userAgent)) return true
  return entorno.platform === 'MacIntel' && (entorno.maxTouchPoints ?? 0) > 1
}

export function esModoStandalone(entorno: EntornoDispositivo): boolean {
  if (entorno.standalone === true) return true
  return entorno.matchMedia?.('(display-mode: standalone)') ?? false
}

export function detectarDispositivo(
  entorno: EntornoDispositivo,
): DeteccionDispositivo {
  const plataforma: Plataforma = esIos(entorno)
    ? 'ios'
    : /Android/i.test(entorno.userAgent)
      ? 'android'
      : 'escritorio'

  return {
    plataforma,
    standalone: esModoStandalone(entorno),
    soportePush:
      entorno.tieneServiceWorker === true &&
      entorno.tienePushManager === true &&
      entorno.tieneNotification === true,
  }
}

/** Entorno real del navegador. Es el único punto que toca `navigator`/`window`. */
export function leerEntornoDispositivo(): EntornoDispositivo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { userAgent: '' }
  }

  const navegador = navigator as Navigator & { standalone?: boolean }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navegador.standalone === true,
    matchMedia: (consulta) => window.matchMedia?.(consulta).matches ?? false,
    tieneServiceWorker: 'serviceWorker' in navigator,
    tienePushManager: 'PushManager' in window,
    tieneNotification: 'Notification' in window,
  }
}

/** Permiso actual del navegador, sin pedirlo. */
export function leerPermiso(): 'default' | 'granted' | 'denied' {
  if (typeof Notification === 'undefined') return 'default'
  return Notification.permission
}
