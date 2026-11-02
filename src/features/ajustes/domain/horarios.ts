import type { Horario } from '../types'
import {
  bloqueValido,
  esHoraValida,
  esMultiploDe15,
  haySolape,
  normalizarHora,
  sumarMinutos,
} from './horas'

/**
 * Modelo de pantalla de los horarios.
 *
 * Decisión del paso 0.4 (sin inventar campos): el backend no tiene un booleano
 * "día activo"; tiene bloques con `activo`. Entonces:
 * - **Día activado** = al menos un bloque con `activo: true`.
 * - **Apagar el día** = PATCH `activo: false` a sus bloques (se conservan las
 *   horas, como pide el diseño).
 * - **Encender un día sin bloques** = POST de un bloque 09:00–13:00.
 * - **Quitar un bloque** = DELETE (borrado físico documentado).
 */

/** Lunes a domingo: `dia_semana` 0 = domingo va al final. */
export const DIAS = [
  { diaSemana: 1, nombre: 'Lunes' },
  { diaSemana: 2, nombre: 'Martes' },
  { diaSemana: 3, nombre: 'Miércoles' },
  { diaSemana: 4, nombre: 'Jueves' },
  { diaSemana: 5, nombre: 'Viernes' },
  { diaSemana: 6, nombre: 'Sábado' },
  { diaSemana: 0, nombre: 'Domingo' },
] as const

export interface FilaHorario {
  diaSemana: number
  nombre: string
  activado: boolean
  bloques: Horario[]
}

function normalizarBloque(bloque: Horario): Horario {
  return {
    ...bloque,
    horaInicio: normalizarHora(bloque.horaInicio) ?? bloque.horaInicio,
    horaFin: normalizarHora(bloque.horaFin) ?? bloque.horaFin,
  }
}

/** Las 7 filas de Lunes a Domingo, con sus bloques ordenados por hora. */
export function filasDeHorario(horarios: readonly Horario[]): FilaHorario[] {
  return DIAS.map((dia) => {
    const bloques = horarios
      .filter((horario) => horario.diaSemana === dia.diaSemana)
      .map(normalizarBloque)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

    return {
      diaSemana: dia.diaSemana,
      nombre: dia.nombre,
      activado: bloques.some((bloque) => bloque.activo),
      bloques,
    }
  })
}

export interface BloqueBorrador {
  /** Clave de React; para bloques nuevos no hay id todavía. */
  clave: string
  id?: number
  horaInicio: string
  horaFin: string
}

export interface DiaBorrador {
  diaSemana: number
  activado: boolean
  bloques: BloqueBorrador[]
}

export function aBorrador(servidor: readonly Horario[]): {
  activado: boolean
  bloques: BloqueBorrador[]
} {
  return {
    activado: servidor.some((bloque) => bloque.activo),
    bloques: servidor.map((bloque) => ({
      clave: `servidor-${bloque.id}`,
      id: bloque.id,
      horaInicio: normalizarHora(bloque.horaInicio) ?? bloque.horaInicio,
      horaFin: normalizarHora(bloque.horaFin) ?? bloque.horaFin,
    })),
  }
}

/** Bloque nuevo: empieza donde termina el último y dura una hora. */
export function bloqueNuevo(
  bloques: readonly BloqueBorrador[],
  clave: string,
): BloqueBorrador {
  const ultimo = [...bloques].sort((a, b) => a.horaFin.localeCompare(b.horaFin)).at(-1)
  const horaInicio = ultimo?.horaFin ?? '09:00'
  const horaFin = sumarMinutos(horaInicio, 60) ?? horaInicio

  return { clave, horaInicio, horaFin }
}

export interface ResultadoDia {
  valido: boolean
  error: string | null
}

/** Validación local del día antes de mandar nada al backend. */
export function validarDia(dia: DiaBorrador): ResultadoDia {
  if (dia.bloques.length === 0) {
    return dia.activado
      ? { valido: false, error: 'Agrega al menos un bloque o apaga el día.' }
      : { valido: true, error: null }
  }

  for (const bloque of dia.bloques) {
    if (!esHoraValida(bloque.horaInicio) || !esHoraValida(bloque.horaFin)) {
      return { valido: false, error: 'Completa las horas de cada bloque.' }
    }

    if (!esMultiploDe15(bloque.horaInicio) || !esMultiploDe15(bloque.horaFin)) {
      return { valido: false, error: 'Las horas deben ir en pasos de 15 minutos.' }
    }

    if (!bloqueValido(bloque.horaInicio, bloque.horaFin)) {
      return { valido: false, error: 'La hora de fin debe ser mayor que la de inicio.' }
    }
  }

  if (haySolape(dia.bloques)) {
    return { valido: false, error: 'Los bloques de este día se cruzan.' }
  }

  return { valido: true, error: null }
}

export type OperacionHorario =
  | {
      tipo: 'crear'
      diaSemana: number
      horaInicio: string
      horaFin: string
      activo: boolean
    }
  | {
      tipo: 'editar'
      id: number
      cambios: { horaInicio?: string; horaFin?: string; activo?: boolean }
    }
  | { tipo: 'eliminar'; id: number }

function firmaBorrador(bloques: readonly BloqueBorrador[]): string {
  return bloques
    .map((bloque) => `${bloque.id ?? 'nuevo'}|${bloque.horaInicio}|${bloque.horaFin}`)
    .sort()
    .join(';')
}

function firmaServidor(servidor: readonly Horario[]): string {
  return servidor
    .map(
      (bloque) =>
        `${bloque.id}|${normalizarHora(bloque.horaInicio) ?? bloque.horaInicio}|${
          normalizarHora(bloque.horaFin) ?? bloque.horaFin
        }`,
    )
    .sort()
    .join(';')
}

export function hayCambiosDia(dia: DiaBorrador, servidor: readonly Horario[]): boolean {
  const activoServidor = servidor.some((bloque) => bloque.activo)
  if (dia.activado !== activoServidor) return true
  return firmaBorrador(dia.bloques) !== firmaServidor(servidor)
}

/**
 * Traduce el borrador del día a las llamadas concretas de la API.
 * Se ejecutan en orden; el primer error detiene el guardado.
 */
export function planificarGuardado(
  dia: DiaBorrador,
  servidor: readonly Horario[],
): OperacionHorario[] {
  const operaciones: OperacionHorario[] = []

  const idsDelBorrador = new Set(
    dia.bloques.flatMap((bloque) => (bloque.id === undefined ? [] : [bloque.id])),
  )

  // 1. Bloques que ya no están en el borrador: se eliminan siempre.
  for (const bloque of servidor) {
    if (!idsDelBorrador.has(bloque.id)) {
      operaciones.push({ tipo: 'eliminar', id: bloque.id })
    }
  }

  // 2. Día apagado: se desactivan los bloques que sigan activos.
  if (!dia.activado) {
    for (const bloque of servidor) {
      if (idsDelBorrador.has(bloque.id) && bloque.activo) {
        operaciones.push({ tipo: 'editar', id: bloque.id, cambios: { activo: false } })
      }
    }
    return operaciones
  }

  // 3. Día encendido sin bloques: se crea el bloque por defecto del diseño.
  if (dia.bloques.length === 0) {
    operaciones.push({
      tipo: 'crear',
      diaSemana: dia.diaSemana,
      horaInicio: '09:00',
      horaFin: '13:00',
      activo: true,
    })
    return operaciones
  }

  // 4. Día encendido: crear, editar horas y reactivar lo que haga falta.
  for (const bloque of dia.bloques) {
    if (bloque.id === undefined) {
      operaciones.push({
        tipo: 'crear',
        diaSemana: dia.diaSemana,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
        activo: true,
      })
      continue
    }

    const original = servidor.find((item) => item.id === bloque.id)
    const cambios: { horaInicio?: string; horaFin?: string; activo?: boolean } = {}

    const inicioOriginal = original
      ? (normalizarHora(original.horaInicio) ?? original.horaInicio)
      : null
    const finOriginal = original
      ? (normalizarHora(original.horaFin) ?? original.horaFin)
      : null

    if (inicioOriginal !== bloque.horaInicio) cambios.horaInicio = bloque.horaInicio
    if (finOriginal !== bloque.horaFin) cambios.horaFin = bloque.horaFin
    if (original && !original.activo) cambios.activo = true

    if (Object.keys(cambios).length > 0) {
      operaciones.push({ tipo: 'editar', id: bloque.id, cambios })
    }
  }

  return operaciones
}
