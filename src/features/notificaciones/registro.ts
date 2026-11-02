import { ErrorNotificaciones } from './domain/errores'

/** Tiempo máximo de espera a que el service worker esté activo. */
export const ESPERA_SERVICE_WORKER_MS = 8_000

/**
 * `navigator.serviceWorker.ready` puede no resolverse nunca si la app no tiene
 * un service worker registrado (por ejemplo en `pnpm dev` sin PWA). Se espera un
 * máximo para poder mostrar un error en lugar de dejar el botón girando.
 */
export function servicioWorkerListo(
  esperaMs: number = ESPERA_SERVICE_WORKER_MS,
): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.reject(new ErrorNotificaciones('sin-soporte'))
  }

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_resolver, rechazar) => {
      setTimeout(() => {
        rechazar(
          new ErrorNotificaciones(
            'suscripcion',
            'La app todavía no está lista para notificaciones. Recarga la página e inténtalo de nuevo.',
          ),
        )
      }, esperaMs)
    }),
  ])
}
