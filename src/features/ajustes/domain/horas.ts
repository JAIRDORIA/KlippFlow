import { hora12 } from '@/shared/lib/fechas'

/**
 * Horas y bloques del editor de horarios.
 *
 * Fuente: `docs/backend/HORARIOS_Y_CONFIGURACION.md`.
 * - Las horas viajan en `HH:mm` con minutos 00/15/30/45 y `horaFin > horaInicio`.
 * - La columna TIME de MySQL puede devolver `HH:mm:ss`; aquí se normaliza.
 */

const PATRON_24 = /^([01]\d|2[0-3]):([0-5]\d)$/
const PATRON_24_CON_SEGUNDOS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
const PATRON_12 = /^(\d{1,2}):([0-5]\d)\s*([ap])\.?\s*m\.?$/i

/** "07:00:00" → "07:00". Devuelve null si no es una hora válida de 24 h. */
export function normalizarHora(valor: string): string | null {
  const limpio = valor.trim()

  const conSegundos = PATRON_24_CON_SEGUNDOS.exec(limpio)
  if (conSegundos) {
    return `${conSegundos[1]}:${conSegundos[2]}`
  }

  if (PATRON_24.test(limpio)) return limpio
  return null
}

export function esHoraValida(valor: string): boolean {
  return normalizarHora(valor) !== null
}

/** Minutos desde la medianoche; null si la hora no es válida. */
export function minutosDeHora(valor: string): number | null {
  const normalizada = normalizarHora(valor)
  if (!normalizada) return null

  const [horas, minutos] = normalizada.split(':')
  if (horas === undefined || minutos === undefined) return null
  return Number(horas) * 60 + Number(minutos)
}

export function esMultiploDe15(valor: string): boolean {
  const minutos = minutosDeHora(valor)
  return minutos !== null && minutos % 15 === 0
}

/** "09:00" → "9:00 am"; "13:05" → "1:05 pm" (formato de toda la app). */
export function horaA12(hora24: string): string {
  return hora12(hora24)
}

/**
 * Convierte lo que se escribe o devuelve el selector nativo a `HH:mm`.
 * Acepta "13:00", "1:00 p. m.", "01:00 pm" y "9:00 a. m.".
 */
export function horaA24(texto: string): string | null {
  const limpio = texto.trim()

  const normalizada = normalizarHora(limpio)
  if (normalizada) return normalizada

  const coincidencia = PATRON_12.exec(limpio)
  if (!coincidencia) return null

  const horas = Number(coincidencia[1])
  const minutos = coincidencia[2] ?? '00'
  const sufijo = (coincidencia[3] ?? '').toLowerCase()

  if (horas < 1 || horas > 12) return null

  const enPM = sufijo === 'p'
  const horas24 = enPM ? (horas === 12 ? 12 : horas + 12) : horas === 12 ? 0 : horas

  return `${String(horas24).padStart(2, '0')}:${minutos}`
}

/** Suma minutos a una hora. Devuelve null si se pasa de las 23:59. */
export function sumarMinutos(hora: string, minutos: number): string | null {
  const base = minutosDeHora(hora)
  if (base === null) return null

  const total = base + minutos
  if (total < 0 || total >= 24 * 60) return null

  const horas = Math.floor(total / 60)
  const resto = total % 60
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
}

/** El backend exige `horaFin` estrictamente mayor que `horaInicio`. */
export function bloqueValido(horaInicio: string, horaFin: string): boolean {
  const inicio = minutosDeHora(horaInicio)
  const fin = minutosDeHora(horaFin)
  if (inicio === null || fin === null) return false
  return fin > inicio
}

interface RangoHoras {
  horaInicio: string
  horaFin: string
}

/**
 * Dos bloques se cruzan si comparten minutos. Que uno termine justo cuando
 * empieza el otro **no** es cruce (el backend lo permite).
 */
export function bloquesSeCruzan(a: RangoHoras, b: RangoHoras): boolean {
  const aInicio = minutosDeHora(a.horaInicio)
  const aFin = minutosDeHora(a.horaFin)
  const bInicio = minutosDeHora(b.horaInicio)
  const bFin = minutosDeHora(b.horaFin)

  if (aInicio === null || aFin === null || bInicio === null || bFin === null) {
    return false
  }

  return aInicio < bFin && bInicio < aFin
}

/** ¿Hay algún cruce entre los bloques de un mismo día? */
export function haySolape(bloques: readonly RangoHoras[]): boolean {
  for (let i = 0; i < bloques.length; i += 1) {
    for (let j = i + 1; j < bloques.length; j += 1) {
      const primero = bloques[i]
      const segundo = bloques[j]
      if (primero && segundo && bloquesSeCruzan(primero, segundo)) return true
    }
  }
  return false
}
