import type { ServicioPublico } from '../types'

export interface SeleccionServicios {
  titular: readonly number[]
  acompanantes: readonly (readonly number[])[]
}

export interface TotalesReserva {
  duracionMinutos: number
  montoTotal: number
  cantidadServicios: number
}

/** La API exige entero entre 5 y 600, divisible por 5. */
export function esDuracionValida(duracionMinutos: number): boolean {
  return (
    Number.isInteger(duracionMinutos) &&
    duracionMinutos >= 5 &&
    duracionMinutos <= 600 &&
    duracionMinutos % 5 === 0
  )
}

function idsUnicos(ids: readonly number[]): number[] {
  return Array.from(new Set(ids))
}

/** Suma duración y precio de titular y acompañantes; ignora ids desconocidos. */
export function calcularTotales(
  seleccion: SeleccionServicios,
  catalogo: readonly ServicioPublico[],
): TotalesReserva {
  const porId = new Map(catalogo.map((servicio) => [servicio.id, servicio]))
  let duracionMinutos = 0
  let montoTotal = 0
  let cantidadServicios = 0

  const personas = [seleccion.titular, ...seleccion.acompanantes]
  for (const ids of personas) {
    for (const id of idsUnicos(ids)) {
      const servicio = porId.get(id)
      if (!servicio) continue

      const duracion = Number(servicio.duracionMinutos)
      const precio = Number(servicio.precio)
      if (Number.isFinite(duracion) && duracion > 0) {
        duracionMinutos += Math.trunc(duracion)
      }
      if (Number.isFinite(precio) && precio > 0) {
        montoTotal += Math.trunc(precio)
      }
      cantidadServicios += 1
    }
  }

  return { duracionMinutos, montoTotal, cantidadServicios }
}
