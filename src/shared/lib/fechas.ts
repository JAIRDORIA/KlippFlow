/**
 * Fechas y horas de KlippFlow.
 *
 * Regla no negociable: el negocio vive en America/Bogota. Estas utilidades usan
 * Intl con esa zona (o UTC sobre fechas de calendario ya normalizadas) y nunca
 * la zona horaria del dispositivo.
 */

export const ZONA_NEGOCIO = 'America/Bogota'

export interface PartesFechaHoraBogota {
  fecha: string
  hora: string
  horas: number
  minutos: number
}

interface PartesCalendario {
  year: number
  month: number
  day: number
}

const formateadorBogota = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_NEGOCIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const formateadorSemanaCorta = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  weekday: 'short',
})

const formateadorSemanaLarga = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  weekday: 'long',
})

const formateadorMesCorto = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  month: 'short',
})

const formateadorMesLargo = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  month: 'long',
})

function pad2(numero: number): string {
  return String(numero).padStart(2, '0')
}

function leerParte(partes: Intl.DateTimeFormatPart[], tipo: string): number {
  const parte = partes.find((item) => item.type === tipo)
  return parte ? Number(parte.value) : Number.NaN
}

function partesBogota(fecha: Date): PartesFechaHoraBogota {
  const partes = formateadorBogota.formatToParts(fecha)
  const year = leerParte(partes, 'year')
  const month = leerParte(partes, 'month')
  const day = leerParte(partes, 'day')
  const horas = leerParte(partes, 'hour')
  const minutos = leerParte(partes, 'minute')

  return {
    fecha: `${year}-${pad2(month)}-${pad2(day)}`,
    hora: `${pad2(horas)}:${pad2(minutos)}`,
    horas,
    minutos,
  }
}

/** Fecha de hoy en Bogotá como YYYY-MM-DD. */
export function hoyBogota(fecha: Date = new Date()): string {
  return partesBogota(fecha).fecha
}

/** Fecha y hora actuales en Bogotá, sin depender de la zona del equipo. */
export function ahoraBogota(fecha: Date = new Date()): PartesFechaHoraBogota {
  return partesBogota(fecha)
}

function parseFechaISO(fechaISO: string): (PartesCalendario & { utc: Date }) | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaISO)
  if (!coincidencia) return null

  const year = Number(coincidencia[1])
  const month = Number(coincidencia[2])
  const day = Number(coincidencia[3])
  const utc = new Date(Date.UTC(year, month - 1, day, 12))

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day, utc }
}

function sumarDiasISO(fechaISO: string, dias: number): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return fechaISO

  const fecha = new Date(partes.utc.getTime() + dias * 24 * 60 * 60 * 1000)
  return `${fecha.getUTCFullYear()}-${pad2(fecha.getUTCMonth() + 1)}-${pad2(fecha.getUTCDate())}`
}

function sinPunto(texto: string): string {
  return texto.replace(/\.$/, '')
}

function capitalizar(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function partesDeFechaISO(fechaISO: string): PartesCalendario | null {
  const partes = parseFechaISO(fechaISO)
  return partes ? { year: partes.year, month: partes.month, day: partes.day } : null
}

/** Suma días de calendario a una fecha YYYY-MM-DD sin usar la zona del equipo. */
export function sumarDias(fechaISO: string, dias: number): string {
  return sumarDiasISO(fechaISO, dias)
}

/** "LUN", "MAR", ... a partir de una fecha YYYY-MM-DD. */
export function diaSemanaCorto(fechaISO: string): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return ''
  return sinPunto(formateadorSemanaCorta.format(partes.utc)).toUpperCase()
}

/** "Hoy", "Mañana" o "sáb 31 oct" (referencia en Bogotá si no se indica). */
export function etiquetaDia(fechaISO: string, referencia: Date = new Date()): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return ''

  const hoy = hoyBogota(referencia)
  if (fechaISO === hoy) return 'Hoy'
  if (fechaISO === sumarDiasISO(hoy, 1)) return 'Mañana'

  const dia = String(partes.day)
  const semana = sinPunto(formateadorSemanaCorta.format(partes.utc))
  const mes = sinPunto(formateadorMesCorto.format(partes.utc))
  return `${semana} ${dia} ${mes}`
}

/** "LUNES · 26 OCT". */
export function eyebrowFecha(fechaISO: string): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return ''

  const semana = formateadorSemanaLarga.format(partes.utc).toUpperCase()
  const mes = sinPunto(formateadorMesCorto.format(partes.utc)).toUpperCase()
  return `${semana} · ${partes.day} ${mes}`
}

/** "lunes 26 de octubre". */
export function fechaLarga(fechaISO: string): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return ''

  const semana = formateadorSemanaLarga.format(partes.utc)
  const mes = formateadorMesLargo.format(partes.utc)
  return `${semana} ${partes.day} de ${mes}`
}

/** Formato de historial: "Dom, 25 de oct". */
export function fechaCorta(fechaISO: string): string {
  const partes = parseFechaISO(fechaISO)
  if (!partes) return ''

  const semana = capitalizar(sinPunto(formateadorSemanaCorta.format(partes.utc)))
  const mes = sinPunto(formateadorMesCorto.format(partes.utc))
  return `${semana}, ${partes.day} de ${mes}`
}

/** "Buen día" antes de 12:00, "Buenas tardes" de 12:00 a 18:59, "Buenas noches" desde 19:00 (Bogotá). */
export function saludo(fecha: Date = new Date()): string {
  const { horas } = ahoraBogota(fecha)
  if (horas < 12) return 'Buen día'
  if (horas < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** "09:00" → "09:00 a. m."; "13:05" → "01:05 p. m.". */
export function hora12(hora24: string): string {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora24)
  if (!coincidencia) return ''

  const horas = Number(coincidencia[1])
  const minutos = coincidencia[2] ?? '00'
  const sufijo = horas < 12 ? 'a. m.' : 'p. m.'
  const hora12Numerica = horas % 12 === 0 ? 12 : horas % 12
  return `${pad2(hora12Numerica)}:${minutos} ${sufijo}`
}

/** Útil para pruebas y para construir fechas de calendario sin zona del equipo. */
export function partesFecha(fechaISO: string): PartesCalendario | null {
  return partesDeFechaISO(fechaISO)
}
