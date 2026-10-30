/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

interface PayloadPush {
  title?: string
  body?: string
  url?: string
}

interface MensajeRefresco {
  tipo: 'klippflow:refrescar'
}

const MENSAJE_REFRESCO: MensajeRefresco = { tipo: 'klippflow:refrescar' }

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('install', () => {
  void self.skipWaiting()
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
    return {
      title: typeof registro.title === 'string' ? registro.title : undefined,
      body: typeof registro.body === 'string' ? registro.body : undefined,
      url: typeof registro.url === 'string' ? registro.url : undefined,
    }
  } catch {
    return { body: evento.data.text() }
  }
}

/**
 * El backend documenta `url: "/solicitudes"`, pero la ruta real de la app es
 * `/app/solicitudes`. Se normaliza ese valor conocido; cualquier otra URL
 * interna se respeta y lo externo cae en la bandeja de solicitudes.
 */
function normalizarUrl(url: string | undefined): string {
  if (!url) return '/app/solicitudes'
  if (url === '/solicitudes') return '/app/solicitudes'
  if (url.startsWith('/')) return url
  return '/app/solicitudes'
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
  const titulo = payload.title?.trim() || 'Nueva solicitud de cita'
  const cuerpo = payload.body ?? ''

  evento.waitUntil(
    (async () => {
      await self.registration.showNotification(titulo, {
        body: cuerpo,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: normalizarUrl(payload.url) },
      })
      await avisarARefrescar()
    })(),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()

  const datos = evento.notification.data as { url?: unknown } | undefined
  const url = normalizarUrl(typeof datos?.url === 'string' ? datos.url : undefined)

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
