/**
 * Claves de consulta de Cuentas.
 *
 * Incluyen el día de hoy en Bogotá: al pasar la medianoche la clave cambia y
 * TanStack Query pide los datos del nuevo día sin ninguna lógica extra.
 *
 * Cuelgan del prefijo `['barbero']`, así que la invalidación global del panel
 * (dashboard, solicitudes, compras y balance) las cubre.
 */

export const clavesBalance = {
  hoy: (fecha: string) => ['barbero', 'balance', 'hoy', fecha] as const,
  historial: (fecha: string) => ['barbero', 'balance', 'historial', fecha] as const,
}
