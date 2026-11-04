/**
 * Carga diferida de Google Identity Services.
 * El script solo se descarga cuando una pantalla monta <BotonGoogle />.
 */

const ID_SCRIPT = 'klippflow-google-gsi'
const URL_SCRIPT = 'https://accounts.google.com/gsi/client'

export interface GoogleCredentialResponse {
  credential?: string
}

interface OpcionesInicializarGoogle {
  client_id: string
  callback: (respuesta: GoogleCredentialResponse) => void
  locale?: string
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

interface OpcionesBotonGoogle {
  type?: string
  theme?: string
  size?: string
  text?: string
  shape?: string
  logo_alignment?: string
  width?: number
}

interface GoogleIdentityApi {
  initialize: (opciones: OpcionesInicializarGoogle) => void
  renderButton: (parent: HTMLElement, opciones: OpcionesBotonGoogle) => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityApi
      }
    }
  }
}

let promesaCarga: Promise<void> | null = null

export function getGoogleClientId(): string | null {
  const valor = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio || null
}

export function cargarGoogleIdentity(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services no está disponible'))
  }

  if (window.google?.accounts?.id) return Promise.resolve()
  if (promesaCarga) return promesaCarga

  promesaCarga = new Promise<void>((resolver, rechazar) => {
    const existente = document.getElementById(ID_SCRIPT)

    function alCargar() {
      if (window.google?.accounts?.id) {
        resolver()
      } else {
        alFallar()
      }
    }

    function alFallar() {
      promesaCarga = null
      document.getElementById(ID_SCRIPT)?.remove()
      rechazar(new Error('No se pudo cargar Google Identity Services'))
    }

    if (existente) {
      existente.addEventListener('load', alCargar, { once: true })
      existente.addEventListener('error', alFallar, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = ID_SCRIPT
    script.src = URL_SCRIPT
    script.async = true
    script.defer = true
    script.addEventListener('load', alCargar, { once: true })
    script.addEventListener('error', alFallar, { once: true })
    document.head.appendChild(script)
  })

  return promesaCarga
}
