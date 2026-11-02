import type { EstadoCuenta } from '../types'

/** Estados del barbero y su presentación. Solo tokens del sistema visual. */

export const ESTADOS: readonly EstadoCuenta[] = ['activo', 'suspendido', 'vencido']

export const ETIQUETA_ESTADO: Record<EstadoCuenta, string> = {
  activo: 'Activo',
  suspendido: 'Suspendido',
  vencido: 'Vencido',
}

/** Variante del `Chip` del kit: verde, ámbar y rojo (todos con tokens). */
export type VarianteEstado = 'verde' | 'ambar' | 'rojo'

export const VARIANTE_ESTADO: Record<EstadoCuenta, VarianteEstado> = {
  activo: 'verde',
  suspendido: 'ambar',
  vencido: 'rojo',
}

/** Efecto real de cada estado (`ADMIN.md` §92-106). */
export const EFECTO_ESTADO: Record<EstadoCuenta, string> = {
  activo: 'Podrá iniciar sesión y recibir reservas.',
  suspendido: 'No podrá iniciar sesión ni recibir reservas.',
  vencido: 'No podrá iniciar sesión ni recibir reservas.',
}

export const OPCIONES_ESTADO: ReadonlyArray<{ valor: EstadoCuenta; etiqueta: string }> = [
  { valor: 'activo', etiqueta: ETIQUETA_ESTADO.activo },
  { valor: 'suspendido', etiqueta: ETIQUETA_ESTADO.suspendido },
  { valor: 'vencido', etiqueta: ETIQUETA_ESTADO.vencido },
]

export function esEstadoValido(valor: string): valor is EstadoCuenta {
  return (ESTADOS as readonly string[]).includes(valor)
}
