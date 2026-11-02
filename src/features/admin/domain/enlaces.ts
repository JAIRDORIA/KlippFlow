/**
 * Link público de reservas de un barbero.
 *
 * El formato lo documenta el backend (`ADMIN.md` §144-157):
 * `https://app.barberapp.com/b/K7M2P9QX`, es decir `{base}/b/{codigoUnico}`.
 * La respuesta de la API ya trae `linkReservas`; esta función es el respaldo y
 * la fuente de verdad del formato.
 */

export function construirLinkReservas(codigoUnico: string, baseUrl: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '')
  const codigo = codigoUnico.trim()
  return `${base}/b/${codigo}`
}

/** Base pública: `VITE_APP_PUBLIC_URL` o el origen actual. */
export function basePublica(): string {
  const configurada = import.meta.env.VITE_APP_PUBLIC_URL?.trim()
  if (configurada) return configurada.replace(/\/+$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/** Usa el link que devuelve la API y solo lo construye si falta. */
export function linkReservasDe(
  barbero: { codigoUnico: string; linkReservas?: string | null },
  baseUrl: string = basePublica(),
): string {
  const delBackend = barbero.linkReservas?.trim()
  if (delBackend) return delBackend
  return construirLinkReservas(barbero.codigoUnico, baseUrl)
}
