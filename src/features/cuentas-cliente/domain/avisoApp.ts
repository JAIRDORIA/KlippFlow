import type { AlmacenDescarte } from '@/features/notificaciones/domain/onboarding'

export const DIAS_DESCARTE_AVISO = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000

/** Clave por cliente: el descarte de un cliente no oculta el aviso de otro. */
export function claveAvisoApp(clienteId: number): string {
  return `klippflow.cliente.avisoApp.${clienteId}`
}

function leerFecha(almacen: AlmacenDescarte | null, clienteId: number): string | null {
  if (!almacen) return null

  try {
    const crudo = almacen.getItem(claveAvisoApp(clienteId))
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null

    const valor = (datos as Record<string, unknown>).descartadoEn
    return typeof valor === 'string' ? valor : null
  } catch {
    return null
  }
}

/** true si el aviso se descartó hace menos de 7 días para este cliente. */
export function descarteAvisoVigente(
  clienteId: number,
  almacen: AlmacenDescarte | null,
  ahora: Date = new Date(),
): boolean {
  const fecha = leerFecha(almacen, clienteId)
  if (!fecha) return false

  const instante = new Date(fecha).getTime()
  if (Number.isNaN(instante)) return false

  const transcurrido = ahora.getTime() - instante
  return transcurrido >= 0 && transcurrido < DIAS_DESCARTE_AVISO * MS_POR_DIA
}

/** Si localStorage falla, no se persiste y el aviso puede volver a mostrarse. */
export function guardarDescarteAviso(
  clienteId: number,
  almacen: AlmacenDescarte | null,
  ahora: Date = new Date(),
): void {
  if (!almacen) return

  try {
    almacen.setItem(
      claveAvisoApp(clienteId),
      JSON.stringify({ descartadoEn: ahora.toISOString() }),
    )
  } catch {
    // Sin almacenamiento: no se persiste el descarte.
  }
}
