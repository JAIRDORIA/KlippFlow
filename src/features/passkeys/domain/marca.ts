export const CLAVE_MARCA_PASSKEY = 'kf_passkey'
export const CLAVE_DESCARTE_CREACION = 'kf_passkey_creacion_descarte'
export const DIAS_DESCARTE_CREACION = 30

const MS_POR_DIA = 24 * 60 * 60 * 1000

export interface AlmacenPasskey {
  getItem: (clave: string) => string | null
  setItem: (clave: string, valor: string) => void
  removeItem: (clave: string) => void
}

/** localStorage con try/catch; null si el navegador lo bloquea. */
export function almacenPasskey(): AlmacenPasskey | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function leerMarcaPasskey(
  almacen: AlmacenPasskey | null = almacenPasskey(),
): boolean {
  if (!almacen) return false
  try {
    return almacen.getItem(CLAVE_MARCA_PASSKEY) === '1'
  } catch {
    return false
  }
}

export function guardarMarcaPasskey(
  almacen: AlmacenPasskey | null = almacenPasskey(),
): void {
  if (!almacen) return
  try {
    almacen.setItem(CLAVE_MARCA_PASSKEY, '1')
  } catch {
    // Sin almacenamiento: la marca no se persiste.
  }
}

export function borrarMarcaPasskey(
  almacen: AlmacenPasskey | null = almacenPasskey(),
): void {
  if (!almacen) return
  try {
    almacen.removeItem(CLAVE_MARCA_PASSKEY)
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}

function leerFechaDescarte(almacen: AlmacenPasskey | null): string | null {
  if (!almacen) return null
  try {
    const crudo = almacen.getItem(CLAVE_DESCARTE_CREACION)
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null
    const fecha = (datos as Record<string, unknown>).descartadoEn
    return typeof fecha === 'string' ? fecha : null
  } catch {
    return null
  }
}

/** true si la oferta de crear passkey se descartó hace menos de 30 días. */
export function descarteCreacionVigente(
  almacen: AlmacenPasskey | null = almacenPasskey(),
  ahora: Date = new Date(),
): boolean {
  const fecha = leerFechaDescarte(almacen)
  if (!fecha) return false

  const instante = new Date(fecha).getTime()
  if (Number.isNaN(instante)) return false

  const transcurrido = ahora.getTime() - instante
  return transcurrido >= 0 && transcurrido < DIAS_DESCARTE_CREACION * MS_POR_DIA
}

export function guardarDescarteCreacion(
  almacen: AlmacenPasskey | null = almacenPasskey(),
  ahora: Date = new Date(),
): void {
  if (!almacen) return
  try {
    almacen.setItem(
      CLAVE_DESCARTE_CREACION,
      JSON.stringify({ descartadoEn: ahora.toISOString() }),
    )
  } catch {
    // Sin almacenamiento: el descarte no se persiste.
  }
}
