/**
 * Claves de consulta de Ajustes.
 *
 * Cuelgan de `['barbero']`, igual que el resto del panel.
 */

export const clavesAjustes = {
  configuracion: ['barbero', 'configuracion'] as const,
  /** Siempre se piden con `incluirInactivos=true`. */
  servicios: ['barbero', 'servicios', 'todos'] as const,
  horarios: ['barbero', 'horarios'] as const,
}
