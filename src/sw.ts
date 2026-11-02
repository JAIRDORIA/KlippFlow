/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { urlDestinoSegura } from './features/notificaciones/domain/urlDestino'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

/**
 * Payload real del backend (`PushPayload` en
 * `docs/backend/NOTIFICACIONES_PUSH.md`): `{ titulo, cuerpo, url }`.
 * `url` llega como `/solicitudes`; `urlDestinoSegura` la traduce a la ruta de
 * esta app y descarta cualquier URL externa.
 */
interface PayloadPush {
  titulo?: string
  cuerpo?: string
  url?: string
}

const TITULO_POR_DEFECTO = 'Nueva solicitud de cita'
const CUERPO_POR_DEFECTO = 'Tienes una nueva solicitud de cita.'
const ICONO = '/icons/icon-192.png'

interface MensajeRefresco {
  tipo: 'klippflow:refrescar'
}

const MENSAJE_REFRESCO: MensajeRefresco = { tipo: 'klippflow:refrescar' }

// `self.__WB_MANIFEST` debe aparecer una sola vez: workbox lo reemplaza al
// inyectar el precache.
const MANIFIESTO_PRECACHE = self.__WB_MANIFEST

// En producción el manifiesto siempre trae entradas. En `pnpm dev` viene vacío:
// sin este guard, `createHandlerBoundToURL('index.html')` lanzaría y el service
// worker de desarrollo no llegaría a activarse.
if (Array.isArray(MANIFIESTO_PRECACHE) && MANIFIESTO_PRECACHE.length > 0) {
  precacheAndRoute(MANIFIESTO_PRECACHE)
  cleanupOutdatedCaches()
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
}

/**
 * El service worker nuevo NO se activa solo: se queda en `waiting` para no
 * recargar la app mientras el usuario tiene un formulario a medias. La app
 * muestra "Hay una versión nueva" y, al pulsar "Actualizar", envía
 * `{ type: 'SKIP_WAITING' }` (lo hace `vite-plugin-pwa` con
 * `registerType: 'prompt'`) y recarga.
 */
interface MensajeActivacion {
  type?: unknown
}

self.addEventListener('message', (evento) => {
  const datos = evento.data as MensajeActivacion | null
  if (datos && datos.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim())
})

function leerPayload(evento: PushEvent): PayloadPush {
  if (!evento.data) return {}

  try {
    const datos: unknown = evento.data.json()
    if (typeof datos !== 'object' || datos === null) return {}
    const registro = datos as Record<string, unknown>

    // `title`/`body` se aceptan como respaldo por si un envío manual usa el
    // formato estándar de la Web Push API.
    const titulo =
      typeof registro.titulo === 'string'
        ? registro.titulo
        : typeof registro.title === 'string'
          ? registro.title
          : undefined

    const cuerpo =
      typeof registro.cuerpo === 'string'
        ? registro.cuerpo
        : typeof registro.body === 'string'
          ? registro.body
          : undefined

    return {
      titulo,
      cuerpo,
      url: typeof registro.url === 'string' ? registro.url : undefined,
    }
  } catch {
    return { cuerpo: evento.data.text() }
  }
}

async function avisarARefrescar(): Promise<void> {
  const ventanas = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  for (const ventana of ventanas) {
    ventana.postMessage(MENSAJE_REFRESCO)
  }
}

self.addEventListener('push', (evento) => {
  const payload = leerPayload(evento)
  const titulo = payload.titulo?.trim() || TITULO_POR_DEFECTO
  const cuerpo = payload.cuerpo?.trim() || CUERPO_POR_DEFECTO

  evento.waitUntil(
    (async () => {
      await self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: ICONO,
        badge: ICONO,
        data: { url: urlDestinoSegura(payload.url, self.location.origin) },
      })
      // Con la app abierta, la lista de Solicitudes se refresca sola.
      await avisarARefrescar()
    })(),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()

  const datos = evento.notification.data as { url?: unknown } | undefined
  const url = urlDestinoSegura(
    typeof datos?.url === 'string' ? datos.url : undefined,
    self.location.origin,
  )

  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const ventana of ventanas) {
        if ('focus' in ventana) {
          await ventana.focus()
          await ventana.navigate(url)
          ventana.postMessage(MENSAJE_REFRESCO)
          return
        }
      }

      const nueva = await self.clients.openWindow(url)
      nueva?.postMessage(MENSAJE_REFRESCO)
    })(),
  )
})
