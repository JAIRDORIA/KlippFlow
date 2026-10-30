/**
 * Detección de iPhone fuera del modo instalado.
 * Solo decide si se ofrece /instalar; no autentica ni cambia la sesión.
 */

export interface EntornoIphone {
  userAgent: string
  standalone: boolean
  displayModeStandalone: boolean
  maxTouchPoints: number
  platform: string
}

function leerEntorno(): EntornoIphone {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      userAgent: '',
      standalone: false,
      displayModeStandalone: false,
      maxTouchPoints: 0,
      platform: '',
    }
  }

  const navegadorIos = navigator as Navigator & { standalone?: boolean }
  const esMacConTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  return {
    userAgent: navigator.userAgent,
    standalone: navegadorIos.standalone === true,
    displayModeStandalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
    maxTouchPoints: esMacConTouch ? 2 : navigator.maxTouchPoints,
    platform: navigator.platform,
  }
}

/**
 * true solo en iPhone/iPad con Safari abierto (sin modo standalone).
 * Se puede inyectar el entorno en pruebas.
 */
export function esIphoneNoInstalada(entorno: EntornoIphone = leerEntorno()): boolean {
  const esIos =
    /iPhone|iPad|iPod/i.test(entorno.userAgent) ||
    (entorno.platform === 'MacIntel' && entorno.maxTouchPoints > 1)

  if (!esIos) return false
  return !entorno.standalone && !entorno.displayModeStandalone
}
