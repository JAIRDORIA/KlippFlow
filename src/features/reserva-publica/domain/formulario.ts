import type { CrearCitaClienteBody } from '@/features/cuentas-cliente/types'
import type { CrearCitaBody, ServicioPublico } from '../types'
import { calcularTotales, esDuracionValida, type SeleccionServicios } from './calculo'
import { normalizarCelular } from './celular'
import { esCorreoValido, normalizarCorreo } from './correo'

export const MAXIMO_PERSONAS = 4
export const MAXIMO_ACOMPANANTES = MAXIMO_PERSONAS - 1
export const MAXIMO_SERVICIOS_POR_PERSONA = 10

export type ModoReserva = 'solo' | 'acompanantes'

export interface AcompananteFormulario {
  id: number
  servicioIds: number[]
}

export interface DatosReserva {
  nombre: string
  celular: string
  correo: string
}

export interface EstadoFormularioReserva {
  serviciosTitular: number[]
  modo: ModoReserva
  acompanantes: AcompananteFormulario[]
  siguienteAcompananteId: number
  fecha: string
  horaInicio: string | null
  datos: DatosReserva
}

export type CampoDatos = keyof DatosReserva

export type AccionFormularioReserva =
  | { tipo: 'alternar-servicio-titular'; servicioId: number }
  | { tipo: 'cambiar-modo'; modo: ModoReserva }
  | { tipo: 'agregar-acompanante' }
  | { tipo: 'quitar-acompanante'; id: number }
  | { tipo: 'alternar-servicio-acompanante'; id: number; servicioId: number }
  | { tipo: 'cambiar-fecha'; fecha: string }
  | { tipo: 'seleccionar-hora'; horaInicio: string | null }
  | { tipo: 'cambiar-dato'; campo: CampoDatos; valor: string }

export function crearEstadoInicial(fecha: string): EstadoFormularioReserva {
  return {
    serviciosTitular: [],
    modo: 'solo',
    acompanantes: [],
    siguienteAcompananteId: 1,
    fecha,
    horaInicio: null,
    datos: { nombre: '', celular: '', correo: '' },
  }
}

function alternarId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((actual) => actual !== id) : [...ids, id]
}

function nuevoAcompanante(id: number): AcompananteFormulario {
  return { id, servicioIds: [] }
}

export function puedeAgregarAcompanante(estado: EstadoFormularioReserva): boolean {
  return (
    estado.modo === 'acompanantes' &&
    estado.acompanantes.length < MAXIMO_ACOMPANANTES
  )
}

export function seleccionParaTotales(
  estado: EstadoFormularioReserva,
): SeleccionServicios {
  return {
    titular: estado.serviciosTitular,
    acompanantes:
      estado.modo === 'acompanantes'
        ? estado.acompanantes.map((acompanante) => acompanante.servicioIds)
        : [],
  }
}

export function reducerFormularioReserva(
  estado: EstadoFormularioReserva,
  accion: AccionFormularioReserva,
): EstadoFormularioReserva {
  switch (accion.tipo) {
    case 'alternar-servicio-titular':
      return {
        ...estado,
        serviciosTitular: alternarId(estado.serviciosTitular, accion.servicioId),
        horaInicio: null,
      }

    case 'cambiar-modo': {
      if (accion.modo === estado.modo) return estado

      if (accion.modo === 'solo') {
        return {
          ...estado,
          modo: 'solo',
          acompanantes: [],
          horaInicio: null,
        }
      }

      const necesitaPrimero = estado.acompanantes.length === 0
      return {
        ...estado,
        modo: 'acompanantes',
        acompanantes: necesitaPrimero
          ? [nuevoAcompanante(estado.siguienteAcompananteId)]
          : estado.acompanantes,
        siguienteAcompananteId: necesitaPrimero
          ? estado.siguienteAcompananteId + 1
          : estado.siguienteAcompananteId,
        horaInicio: null,
      }
    }

    case 'agregar-acompanante': {
      if (!puedeAgregarAcompanante(estado)) return estado
      return {
        ...estado,
        acompanantes: [
          ...estado.acompanantes,
          nuevoAcompanante(estado.siguienteAcompananteId),
        ],
        siguienteAcompananteId: estado.siguienteAcompananteId + 1,
        horaInicio: null,
      }
    }

    case 'quitar-acompanante': {
      if (!estado.acompanantes.some((acompanante) => acompanante.id === accion.id)) {
        return estado
      }
      const restantes = estado.acompanantes.filter(
        (acompanante) => acompanante.id !== accion.id,
      )
      return {
        ...estado,
        modo: restantes.length === 0 ? 'solo' : estado.modo,
        acompanantes: restantes,
        horaInicio: null,
      }
    }

    case 'alternar-servicio-acompanante': {
      if (!estado.acompanantes.some((acompanante) => acompanante.id === accion.id)) {
        return estado
      }
      return {
        ...estado,
        acompanantes: estado.acompanantes.map((acompanante) =>
          acompanante.id === accion.id
            ? {
                ...acompanante,
                servicioIds: alternarId(acompanante.servicioIds, accion.servicioId),
              }
            : acompanante,
        ),
        horaInicio: null,
      }
    }

    case 'cambiar-fecha':
      if (accion.fecha === estado.fecha) return estado
      return { ...estado, fecha: accion.fecha, horaInicio: null }

    case 'seleccionar-hora':
      return { ...estado, horaInicio: accion.horaInicio }

    case 'cambiar-dato':
      return {
        ...estado,
        datos: { ...estado.datos, [accion.campo]: accion.valor },
      }

    default:
      return estado
  }
}

export interface ErroresDatos {
  nombre?: string
  celular?: string
  correo?: string
}

export function validarDatos(datos: DatosReserva): ErroresDatos {
  const errores: ErroresDatos = {}
  const nombre = datos.nombre.trim()

  if (nombre.length < 2) {
    errores.nombre = 'Escribe tu nombre.'
  } else if (nombre.length > 100) {
    errores.nombre = 'El nombre no puede superar 100 caracteres.'
  }

  if (!normalizarCelular(datos.celular)) {
    errores.celular = 'Escribe un celular de 10 dígitos que empiece por 3.'
  }

  if (!esCorreoValido(datos.correo)) {
    errores.correo = 'Escribe un correo válido.'
  }

  return errores
}

function todosLosIdsExisten(
  ids: readonly number[],
  idsCatalogo: ReadonlySet<number>,
): boolean {
  return ids.every((id) => idsCatalogo.has(id))
}

function esSeleccionValida(
  estado: EstadoFormularioReserva,
  catalogo: readonly ServicioPublico[],
): boolean {
  if (estado.serviciosTitular.length === 0) return false
  if (estado.serviciosTitular.length > MAXIMO_SERVICIOS_POR_PERSONA) return false
  if (!estado.fecha || !estado.horaInicio) return false

  const idsCatalogo = new Set(catalogo.map((servicio) => servicio.id))
  if (!todosLosIdsExisten(estado.serviciosTitular, idsCatalogo)) return false

  if (estado.modo === 'acompanantes') {
    if (estado.acompanantes.length === 0) return false
    if (estado.acompanantes.length > MAXIMO_ACOMPANANTES) return false
    for (const acompanante of estado.acompanantes) {
      if (acompanante.servicioIds.length === 0) return false
      if (acompanante.servicioIds.length > MAXIMO_SERVICIOS_POR_PERSONA) return false
      if (!todosLosIdsExisten(acompanante.servicioIds, idsCatalogo)) return false
    }
  }

  const totales = calcularTotales(seleccionParaTotales(estado), catalogo)
  return esDuracionValida(totales.duracionMinutos)
}

export function esFormularioValido(
  estado: EstadoFormularioReserva,
  catalogo: readonly ServicioPublico[],
): boolean {
  if (Object.keys(validarDatos(estado.datos)).length > 0) return false
  return esSeleccionValida(estado, catalogo)
}

/** Validez de la reserva con sesión: el nombre/celular salen del perfil. */
export function esFormularioClienteValido(
  estado: EstadoFormularioReserva,
  catalogo: readonly ServicioPublico[],
): boolean {
  return esSeleccionValida(estado, catalogo)
}

function personasDelFormulario(estado: EstadoFormularioReserva) {
  return [
    { servicioIds: Array.from(new Set(estado.serviciosTitular)) },
    ...(estado.modo === 'acompanantes'
      ? estado.acompanantes.map((acompanante) => ({
          servicioIds: Array.from(new Set(acompanante.servicioIds)),
        }))
      : []),
  ]
}

/** Construye exactamente el cuerpo documentado o null si el formulario no es válido. */
export function construirCuerpoCrearCita(
  estado: EstadoFormularioReserva,
  catalogo: readonly ServicioPublico[],
): CrearCitaBody | null {
  if (!esFormularioValido(estado, catalogo) || !estado.horaInicio) return null

  const celular = normalizarCelular(estado.datos.celular)
  if (!celular) return null

  const personas = personasDelFormulario(estado)

  const cuerpo: CrearCitaBody = {
    nombre: estado.datos.nombre.trim(),
    celular,
    fecha: estado.fecha,
    horaInicio: estado.horaInicio,
    personas,
  }

  const correo = normalizarCorreo(estado.datos.correo)
  if (correo) cuerpo.correo = correo

  return cuerpo
}

/**
 * Cuerpo documentado para POST /cliente/barberos/:codigo/citas.
 * El nombre, celular y correo salen del perfil autenticado.
 * `aceptaWhatsapp` es el consentimiento explícito y va siempre (false por defecto).
 */
export function construirCuerpoCitaCliente(
  estado: EstadoFormularioReserva,
  catalogo: readonly ServicioPublico[],
  aceptaWhatsapp = false,
): CrearCitaClienteBody | null {
  if (!esFormularioClienteValido(estado, catalogo) || !estado.horaInicio) {
    return null
  }

  return {
    fecha: estado.fecha,
    horaInicio: estado.horaInicio,
    personas: personasDelFormulario(estado),
    aceptaWhatsapp,
  }
}
