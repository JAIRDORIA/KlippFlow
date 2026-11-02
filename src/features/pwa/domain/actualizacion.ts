/**
 * Cuándo se busca una versión nueva del service worker.
 *
 * El navegador ya revisa `sw.js` al navegar; esto cubre el caso de una PWA
 * instalada que se queda abierta mucho tiempo: al volver a la app (foco o
 * pestaña visible) se busca, como mucho, una vez cada 30 minutos.
 */

export const INTERVALO_COMPROBACION_MS = 30 * 60_000

export function debeComprobarActualizacion(
  ultimaComprobacionMs: number | null,
  ahoraMs: number,
  intervaloMs: number = INTERVALO_COMPROBACION_MS,
): boolean {
  if (ultimaComprobacionMs === null) return true
  if (!Number.isFinite(ahoraMs) || !Number.isFinite(ultimaComprobacionMs)) return true
  // Si el reloj retrocede (cambio de hora manual), se permite comprobar de nuevo.
  if (ahoraMs < ultimaComprobacionMs) return true
  return ahoraMs - ultimaComprobacionMs >= intervaloMs
}
