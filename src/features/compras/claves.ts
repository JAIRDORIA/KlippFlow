/**
 * Claves de consulta de Compras.
 *
 * Igual que en Cuentas, incluyen el día de Bogotá para que la lista se
 * refresque sola al pasar la medianoche. Cuelgan de `['barbero']`, así que la
 * invalidación global del panel las cubre.
 */

export const clavesCompras = {
  lista: (fecha: string) => ['barbero', 'compras', fecha] as const,
}
