/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import {
  construirOpcionesNotificacion,
  esPayloadCliente,
  type PayloadPushBase,
} from './features/notificaciones/domain/notificacion'
import {
  urlDestinoCliente,
  urlDestinoSegura,
} from './features/notificaciones/domain/urlDestino'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

/**
 * Payload de los dos push:
 * - barbero: `{ titulo, cuerpo, url }`.
 * - cliente: `{ titulo, cuerpo, url, tag, tipo, citaId }`.
 *
 * `url` del barbero llega como `/solicitudes`; `urlDestinoSegura` la traduce.
 * El cliente valida su URL con la misma regla que `volverSeguro` y cae en `/mi`.
 */
interface PayloadPush extends PayloadPushBase {
  title?: string
  body?: string
}

const TITULO_POR_DEFECTO = 'Nueva solicitud de cita'
const CUERPO_POR_DEFECTO = 'Tienes una nueva solicitud de cita.'
const TITULO_CLIENTE_POR_DEFECTO = 'Actualización de tu cita'
const CUERPO_CLIENTE_POR_DEFECTO = 'Revisa el estado de tu cita.'

interface MensajePush {
  tipo: 'klippflow:refrescar' | 'push-cliente'
}

const MENSAJE_REFRESCO: MensajePush = { tipo: 'klippflow:refrescar' }
const MENSAJE_PUSH_CLIENTE: MensajePush = { tipo: 'push-cliente' }

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
      tag: typeof registro.tag === 'string' ? registro.tag : undefined,
      tipo: typeof registro.tipo === 'string' ? registro.tipo : undefined,
      citaId:
        typeof registro.citaId === 'number' && Number.isFinite(registro.citaId)
          ? registro.citaId
          : undefined,
    }
  } catch {
    return { cuerpo: evento.data.text() }
  }
}

async function avisarVentanas(mensaje: MensajePush): Promise<void> {
  const ventanas = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  for (const ventana of ventanas) {
    ventana.postMessage(mensaje)
  }
}

self.addEventListener('push', (evento) => {
  const payload = leerPayload(evento)
  const esCliente = esPayloadCliente(payload)
  const titulo =
    payload.titulo?.trim() ||
    (esCliente ? TITULO_CLIENTE_POR_DEFECTO : TITULO_POR_DEFECTO)
  const cuerpo =
    payload.cuerpo?.trim() ||
    (esCliente ? CUERPO_CLIENTE_POR_DEFECTO : CUERPO_POR_DEFECTO)

  evento.waitUntil(
    (async () => {
      // `icon` es el ícono grande a color; `badge` es el monocromático que
      // Android usa como máscara de alfa en la barra de estado.
      await self.registration.showNotification(
        titulo,
        construirOpcionesNotificacion(
          cuerpo,
          payload.url,
          self.location.origin,
          payload.tag,
          esCliente ? 'cliente' : 'barbero',
        ),
      )
      // El barbero refresca Solicitudes; el cliente invalida sus citas.
      await avisarVentanas(
        esCliente ? MENSAJE_PUSH_CLIENTE : MENSAJE_REFRESCO,
      )
    })(),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()

  const datos = evento.notification.data as
    | { url?: unknown; zona?: unknown }
    | undefined
  const urlOriginal = typeof datos?.url === 'string' ? datos.url : undefined
  const esCliente = datos?.zona === 'cliente'
  const url = esCliente
    ? urlDestinoCliente(urlOriginal)
    : urlDestinoSegura(urlOriginal, self.location.origin)
  const mensaje = esCliente ? MENSAJE_PUSH_CLIENTE : MENSAJE_REFRESCO

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
          ventana.postMessage(mensaje)
          return
        }
      }

      const nueva = await self.clients.openWindow(url)
      nueva?.postMessage(mensaje)
    })(),
  )
})
