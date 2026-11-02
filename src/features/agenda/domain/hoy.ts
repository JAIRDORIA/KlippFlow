import { eyebrowFecha, hoyBogota, saludo } from '@/shared/lib/fechas'

/**
 * Cabecera de la pantalla Hoy: eyebrow con día y fecha de Bogotá y título
 * "{saludo}, {primer nombre}". Se recalcula con el reloj inyectado, así que
 * al cambiar el día con la app abierta el texto cambia solo.
 */

export function primerNombre(nombre: string | null | undefined): string {
  if (!nombre) return ''
  const limpio = nombre.trim()
  if (!limpio) return ''
  const [primero] = limpio.split(/\s+/)
  return primero ?? ''
}

export interface EncabezadoHoy {
  eyebrow: string
  titulo: string
}

export function encabezadoHoy(
  nombreCompleto: string | null | undefined,
  ahora: Date = new Date(),
): EncabezadoHoy {
  const nombre = primerNombre(nombreCompleto)
  const saludoActual = saludo(ahora)

  return {
    eyebrow: eyebrowFecha(hoyBogota(ahora)),
    titulo: nombre ? `${saludoActual}, ${nombre}` : saludoActual,
  }
}
