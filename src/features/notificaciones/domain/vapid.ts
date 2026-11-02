/**
 * Conversión de la llave pública VAPID (base64url) al `Uint8Array` que exige
 * `pushManager.subscribe({ applicationServerKey })`.
 *
 * `GET /barbero/push/llave-publica` devuelve `{ publicKey }` en base64url, que
 * puede venir con o sin relleno y usar `-` y `_` en lugar de `+` y `/`.
 */

const RELLENO = /^[A-Za-z0-9+/]+={0,2}$/

export function claveVapidABytes(clave: string): Uint8Array<ArrayBuffer> | null {
  const limpia = clave.trim()
  if (!limpia) return null

  const normalizada = limpia.replace(/-/g, '+').replace(/_/g, '/')
  if (normalizada.length % 4 === 1) return null

  const conRelleno = normalizada + '='.repeat((4 - (normalizada.length % 4)) % 4)
  if (!RELLENO.test(conRelleno)) return null

  try {
    const binario = atob(conRelleno)
    // ArrayBuffer explícito: es lo que acepta `applicationServerKey`.
    const bytes = new Uint8Array(new ArrayBuffer(binario.length))
    for (let indice = 0; indice < binario.length; indice += 1) {
      bytes[indice] = binario.charCodeAt(indice)
    }
    return bytes
  } catch {
    return null
  }
}
