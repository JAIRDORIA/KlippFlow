import { hoyBogota } from '@/shared/lib/fechas'

/**
 * Fecha que entra en las claves de consulta de Cuentas y Compras.
 *
 * Es el día de Bogotá, nunca la zona del dispositivo. Al pasar la medianoche
 * cambia, la clave cambia y las consultas se refrescan solas.
 */
export function fechaConsulta(ahora: Date = new Date()): string {
  return hoyBogota(ahora)
}
