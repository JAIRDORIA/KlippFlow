import {
  diaSemanaCorto,
  hoyBogota,
  partesFecha,
  sumarDias,
} from '@/shared/lib/fechas'

/** El backend permite desde hoy hasta hoy + 7 días, ambos incluidos. */
export const HORIZONTE_DIAS = 7

export interface DiaSeleccionable {
  fecha: string
  diaSemana: string
  dia: number
  esHoy: boolean
}

/** Genera 8 días por defecto: hoy más los 7 siguientes. */
export function generarDiasDisponibles(
  hoyISO: string = hoyBogota(),
  horizonteDias: number = HORIZONTE_DIAS,
): DiaSeleccionable[] {
  const dias: DiaSeleccionable[] = []

  for (let indice = 0; indice <= horizonteDias; indice += 1) {
    const fecha = sumarDias(hoyISO, indice)
    const partes = partesFecha(fecha)
    if (!partes) continue

    dias.push({
      fecha,
      diaSemana: diaSemanaCorto(fecha),
      dia: partes.day,
      esHoy: indice === 0,
    })
  }

  return dias
}
