import { normalizarCelular } from '@/features/reserva-publica/domain/celular'
import { parsearMontoEscrito } from '@/shared/lib/montos'
import type {
  CuerpoServicioSinCita,
  ModoServicioSinCita,
  ServicioSinCita,
} from '../types'
import { validarPropina } from './propina'

/**
 * Reglas del registro de un cliente sin cita.
 *
 * Fuente: contrato de `POST /barbero/servicios-sin-cita` y
 * `GET /barbero/servicios` (ver `docs/SERVICIO_SIN_CITA_FRONT.md`).
 *
 * - 1 a 10 servicios activos, sin repetir.
 * - La suma de duraciones debe quedar entre 5 y 600 minutos.
 * - `montoCobrado`: entero 0–10.000.000; si no se envía, el backend usa la
 *   suma de precios del catálogo.
 * - `montoPropina`: entero 1–1.000.000 y **solo** con `modo: "atendido"`.
 * - `clienteNombre`: hasta 100 caracteres; vacío equivale a omitirlo.
 * - `clienteCelular`: celular colombiano; se envía normalizado a 10 dígitos.
 */

export const MAX_SERVICIOS_SIN_CITA = 10
export const MONTO_COBRADO_MAXIMO = 10_000_000
/** 10.000.000 son 8 dígitos. */
export const MONTO_COBRADO_MAX_DIGITOS = 8
export const NOMBRE_SIN_CITA_MAX = 100
export const DURACION_SIN_CITA_MIN = 5
export const DURACION_SIN_CITA_MAX = 600

/** `servicio.precio` puede llegar como número o texto. */
export function precioDeServicio(servicio: ServicioSinCita): number {
  const numero =
    typeof servicio.precio === 'number' ? servicio.precio : Number(servicio.precio)
  if (!Number.isFinite(numero) || numero <= 0) return 0
  return Math.trunc(numero)
}

/** Minutos de un servicio; cualquier valor raro cuenta como 0. */
export function duracionDeServicio(servicio: ServicioSinCita): number {
  const minutos = servicio.duracionMinutos
  if (!Number.isFinite(minutos) || minutos <= 0) return 0
  return Math.trunc(minutos)
}

/** Suma de precios del catálogo para los servicios elegidos. */
export function totalCatalogo(servicios: readonly ServicioSinCita[]): number {
  return servicios.reduce((total, servicio) => total + precioDeServicio(servicio), 0)
}

/** Suma de duraciones de los servicios elegidos. */
export function duracionCatalogo(servicios: readonly ServicioSinCita[]): number {
  return servicios.reduce(
    (total, servicio) => total + duracionDeServicio(servicio),
    0,
  )
}

/**
 * Alterna un servicio en la selección. Con 10 ya elegidos un servicio nuevo no
 * entra (la UI avisa con `puedeAgregarServicio`); quitar siempre se permite.
 */
export function alternarServicio(
  seleccionados: readonly number[],
  id: number,
): number[] {
  if (seleccionados.includes(id)) {
    return seleccionados.filter((actual) => actual !== id)
  }
  if (seleccionados.length >= MAX_SERVICIOS_SIN_CITA) return [...seleccionados]
  return [...seleccionados, id]
}

export function puedeAgregarServicio(seleccionados: readonly number[]): boolean {
  return seleccionados.length < MAX_SERVICIOS_SIN_CITA
}

export interface EntradaSinCita {
  modo: ModoServicioSinCita
  /** Catálogo activo que devolvió la API. */
  catalogo: readonly ServicioSinCita[]
  seleccionados: readonly number[]
  /** Texto tal como se escribe en el campo (con puntos de miles). */
  textoMonto: string
  /** Propina escrita; se ignora por completo con `modo: "en_curso"`. */
  textoPropina: string
  nombre: string
  celular: string
}

export interface ErroresSinCita {
  servicios?: string
  monto?: string
  propina?: string
  nombre?: string
  celular?: string
}

export interface ResultadoSinCita {
  valido: boolean
  modo: ModoServicioSinCita
  errores: ErroresSinCita
  /** Servicios del catálogo en el orden en que se eligieron. */
  servicios: ServicioSinCita[]
  total: number
  duracion: number
  /** `null` significa «no enviar» y dejar que el backend use el catálogo. */
  montoCobrado: number | null
  montoPropina: number | null
  nombre: string
  celular: string | null
}

export function validarSinCita(entrada: EntradaSinCita): ResultadoSinCita {
  const errores: ErroresSinCita = {}

  const servicios = entrada.seleccionados
    .map((id) => entrada.catalogo.find((servicio) => servicio.id === id))
    .filter((servicio): servicio is ServicioSinCita => servicio !== undefined)

  const total = totalCatalogo(servicios)
  const duracion = duracionCatalogo(servicios)

  if (entrada.seleccionados.length === 0) {
    errores.servicios = 'Elige al menos un servicio.'
  } else if (servicios.length !== entrada.seleccionados.length) {
    errores.servicios =
      'Ese servicio ya no está disponible. Actualiza la lista e inténtalo de nuevo.'
  } else if (duracion < DURACION_SIN_CITA_MIN || duracion > DURACION_SIN_CITA_MAX) {
    errores.servicios = 'La duración total debe estar entre 5 y 600 minutos.'
  }

  const textoMonto = entrada.textoMonto.trim()
  let montoCobrado: number | null = null
  if (textoMonto) {
    montoCobrado = parsearMontoEscrito(textoMonto)
    if (montoCobrado === null) {
      errores.monto = 'El monto debe ser un número entero, sin decimales ni letras.'
    } else if (montoCobrado < 0 || montoCobrado > MONTO_COBRADO_MAXIMO) {
      errores.monto = 'El monto debe estar entre $0 y $10.000.000.'
    }
  }

  let montoPropina: number | null = null
  if (entrada.modo === 'atendido') {
    const textoPropina = entrada.textoPropina.trim()
    if (textoPropina) {
      const propina = validarPropina(textoPropina, { permiteCero: false })
      if (propina.valido) montoPropina = propina.monto
      else errores.propina = propina.error ?? undefined
    }
  }

  const nombre = entrada.nombre.trim()
  if (nombre.length > NOMBRE_SIN_CITA_MAX) {
    errores.nombre = `El nombre no puede pasar de ${NOMBRE_SIN_CITA_MAX} caracteres.`
  }

  const textoCelular = entrada.celular.trim()
  let celular: string | null = null
  if (textoCelular) {
    celular = normalizarCelular(textoCelular)
    if (!celular) {
      errores.celular = 'Escribe un celular de 10 dígitos que empiece por 3.'
    }
  }

  return {
    valido: Object.keys(errores).length === 0,
    modo: entrada.modo,
    errores,
    servicios,
    total,
    duracion,
    montoCobrado,
    montoPropina,
    nombre,
    celular,
  }
}

/**
 * Cuerpo del POST. Devuelve `null` si la validación falló.
 *
 * Solo se envía lo que el backend necesita: `montoCobrado` cuando el barbero lo
 * cambió respecto al total del catálogo, propina únicamente en `atendido` y los
 * datos del cliente cuando tienen contenido.
 */
export function construirCuerpoSinCita(
  resultado: ResultadoSinCita,
): CuerpoServicioSinCita | null {
  if (!resultado.valido) return null

  const cuerpo: CuerpoServicioSinCita = {
    modo: resultado.modo,
    servicioIds: resultado.servicios.map((servicio) => servicio.id),
  }

  if (
    resultado.montoCobrado !== null &&
    resultado.montoCobrado !== resultado.total
  ) {
    cuerpo.montoCobrado = resultado.montoCobrado
  }

  if (resultado.modo === 'atendido' && resultado.montoPropina !== null) {
    cuerpo.montoPropina = resultado.montoPropina
  }

  if (resultado.nombre) cuerpo.clienteNombre = resultado.nombre
  if (resultado.celular) cuerpo.clienteCelular = resultado.celular

  return cuerpo
}
