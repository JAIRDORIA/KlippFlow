/**
 * Pestaña del login (Barbero / Cliente) recordada por dispositivo.
 *
 * El barbero entra siempre desde el mismo teléfono con el usuario que le da el
 * administrador: elige "Barbero" una vez y el login le abre ahí en adelante.
 * Es una preferencia del dispositivo, no de la sesión: cerrar sesión no la
 * borra.
 */
import { esRutaDeBarbero } from '@/shared/lib/rutas'

export type PestanaLogin = 'barbero' | 'cliente'

export const CLAVE_PESTANA_LOGIN = 'kf_login_pestana'

export interface AlmacenPestana {
  getItem: (clave: string) => string | null
  setItem: (clave: string, valor: string) => void
}

/** localStorage con try/catch; null si el navegador lo bloquea. */
export function almacenPestana(): AlmacenPestana | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Pestaña con la que abre el login.
 *
 * Si hay un destino (`volver`), manda su zona: un enlace al panel
 * (`/dashboard`, `/app/*`, `/instalar`) abre en "Barbero"; una reserva o una
 * ruta de cliente abre en "Cliente". Sin destino se usa la preferencia del
 * dispositivo.
 */
export function pestanaInicial(
  destino: string | null,
  almacen: AlmacenPestana | null = almacenPestana(),
): PestanaLogin {
  if (destino !== null) return esRutaDeBarbero(destino) ? 'barbero' : 'cliente'
  if (!almacen) return 'cliente'
  try {
    return almacen.getItem(CLAVE_PESTANA_LOGIN) === 'barbero'
      ? 'barbero'
      : 'cliente'
  } catch {
    return 'cliente'
  }
}

export function guardarPestana(
  pestana: PestanaLogin,
  almacen: AlmacenPestana | null = almacenPestana(),
): void {
  if (!almacen) return
  try {
    almacen.setItem(CLAVE_PESTANA_LOGIN, pestana)
  } catch {
    // Sin almacenamiento: la preferencia no se persiste.
  }
}
