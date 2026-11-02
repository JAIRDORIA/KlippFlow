import type { CitaBarbero, ResumenDia } from '../types'

/**
 * Reglas puras de la agenda de Hoy.
 * Fuente: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md`.
 */

const PATRON_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

function aMinutos(hora: string): number | null {
  const coincidencia = PATRON_HORA.exec(hora)
  if (!coincidencia) return null
  const horas = Number(coincidencia[1])
  const minutos = Number(coincidencia[2])
  return horas * 60 + minutos
}

/**
 * Duración en minutos entre dos horas `HH:mm`. Si el fin es menor que el
 * inicio se asume que cruza la medianoche.
 */
export function minutosEntreHoras(horaInicio: string, horaFin: string): number {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  if (inicio === null || fin === null) return 0

  const diferencia = fin - inicio
  return diferencia < 0 ? diferencia + 24 * 60 : diferencia
}

export type PuntoCita = 'atendida' | 'proxima' | 'futura' | 'noAsistio'

/**
 * La próxima cita es la primera cita `aceptada`, ordenada por hora de inicio,
 * que todavía no se atendió ni se marcó como no asistió.
 */
export function seleccionarProximaCita(
  citas: readonly CitaBarbero[],
): CitaBarbero | null {
  let proxima: CitaBarbero | null = null

  for (const cita of citas) {
    if (cita.estado !== 'aceptada') continue
    if (proxima === null || cita.horaInicio < proxima.horaInicio) {
      proxima = cita
    }
  }

  return proxima
}

export function estadoVisualCita(
  cita: CitaBarbero,
  idProxima: number | null,
): PuntoCita {
  if (cita.estado === 'atendida') return 'atendida'
  if (cita.estado === 'no_asistio') return 'noAsistio'
  if (cita.estado === 'aceptada' && cita.id === idProxima) return 'proxima'
  return 'futura'
}

export interface ContadoresHoy {
  porAtender: number
  atendidos: number
  solicitudes: number
}

/**
 * Contadores de la cabecera. "Por atender" son las citas aceptadas del día y
 * "Atendidos" las atendidas; "Solicitudes" son las pendientes vigentes de
 * cualquier fecha, tal como las entrega `resumen`.
 */
export function calcularContadores(resumen: ResumenDia | null | undefined): ContadoresHoy {
  return {
    porAtender: enteroSeguro(resumen?.aceptadas),
    atendidos: enteroSeguro(resumen?.atendidas),
    solicitudes: enteroSeguro(resumen?.solicitudesPendientes),
  }
}

function enteroSeguro(valor: number | null | undefined): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return 0
  return Math.trunc(valor)
}

/** Nombres de servicio sin repetir, en el orden en que llegan. */
export function serviciosDeCita(cita: CitaBarbero): string[] {
  const nombres = new Set<string>()
  for (const persona of cita.personas ?? []) {
    for (const servicio of persona.servicios ?? []) {
      const nombre = servicio.nombre?.trim()
      if (nombre) nombres.add(nombre)
    }
  }
  return [...nombres]
}

export interface AcompananteDetalle {
  nombre: string | null
  servicios: string[]
}

/**
 * Acompañantes con el detalle que entrega la API. No hay edades en el
 * contrato: solo nombre (opcional) y servicios.
 */
export function acompanantesDeCita(cita: CitaBarbero): AcompananteDetalle[] {
  return (cita.personas ?? [])
    .filter((persona) => !persona.esTitular)
    .map((persona) => ({
      nombre: persona.nombre?.trim() || null,
      servicios: (persona.servicios ?? [])
        .map((servicio) => servicio.nombre?.trim())
        .filter((nombre): nombre is string => Boolean(nombre)),
    }))
}

export function nombreCliente(cita: CitaBarbero): string {
  const nombre = cita.cliente?.nombre?.trim()
  if (nombre) return nombre

  const titular = (cita.personas ?? []).find((persona) => persona.esTitular)
  const nombreTitular = titular?.nombre?.trim()
  return nombreTitular || 'Cliente'
}

export function propinaDeCita(cita: CitaBarbero): number {
  const valor = cita.atencion?.montoPropina
  if (valor === null || valor === undefined) return 0
  const numero = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return 0
  return Math.trunc(numero)
}
