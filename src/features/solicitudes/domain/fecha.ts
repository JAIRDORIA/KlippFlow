import { etiquetaDia } from '@/shared/lib/fechas'

/**
 * Etiqueta de fecha de una solicitud: "Hoy", "Mañana" o "sáb 31 oct".
 * Delega en las utilidades de Bogotá para no usar la zona del dispositivo.
 */
export function etiquetaFechaSolicitud(
  fechaISO: string,
  referencia: Date = new Date(),
): string {
  return etiquetaDia(fechaISO, referencia)
}
