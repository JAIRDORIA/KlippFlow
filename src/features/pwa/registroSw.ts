import { registerSW } from 'virtual:pwa-register'

/**
 * Registro del service worker.
 *
 * Aísla `virtual:pwa-register` (módulo virtual de `vite-plugin-pwa`) para que el
 * resto de la app no dependa de él. La estrategia es `registerType: 'prompt'`:
 * cuando hay una versión nueva, el service worker se queda esperando y aquí se
 * avisa con `alNecesitarActualizar`; nada se recarga solo.
 */

export type Actualizador = (recargarPagina?: boolean) => Promise<void>

export interface HandlersRegistro {
  /** Hay una versión nueva lista (el service worker nuevo está en espera). */
  alNecesitarActualizar: () => void
  /** Se registró (o ya estaba) el service worker. */
  alRegistrar?: (registro: ServiceWorkerRegistration | undefined) => void
  alFallar?: (error: unknown) => void
}

export function registrarServiceWorker(handlers: HandlersRegistro): Actualizador {
  const actualizar = registerSW({
    immediate: true,
    onNeedRefresh: handlers.alNecesitarActualizar,
    onRegisteredSW: (_url, registro) => {
      handlers.alRegistrar?.(registro)
    },
    onRegisterError: (error) => {
      handlers.alFallar?.(error)
    },
  })

  return async (recargarPagina = true) => {
    await actualizar(recargarPagina)
  }
}
