/**
 * Claves de consulta del panel del barbero.
 *
 * Todo lo del barbero vive bajo el prefijo `barbero` para que una sola
 * invalidación (por ejemplo al recibir un push) refresque agenda, solicitudes,
 * compras y balance.
 *
 * Las claves de balance ya no se reservan aquí: viven en
 * `features/cuentas/claves.ts` e incluyen el día de Bogotá. Siguen colgando de
 * `['barbero']`, así que la invalidación de las mutaciones las cubre igual.
 */

export const PREFIJO_BARBERO = ['barbero'] as const

export const clavesConsulta = {
  dashboardHoy: ['barbero', 'dashboard', 'hoy'] as const,
  solicitudes: ['barbero', 'solicitudes'] as const,
  /**
   * Catálogo activo para el selector de «cliente sin cita». Es distinto de
   * `['barbero','servicios','todos']` de Ajustes, que sí incluye inactivos;
   * ambos cuelgan de `barbero`, así que la invalidación los cubre.
   */
  serviciosActivos: ['barbero', 'servicios', 'activos'] as const,
  /** Disponibilidad para reprogramar una cita concreta. */
  disponibilidadCambioHora: (citaId: number, fecha: string) =>
    ['barbero', 'citas', citaId, 'disponibilidad', fecha] as const,
}
