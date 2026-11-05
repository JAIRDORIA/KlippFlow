import { volverSeguro } from '@/shared/lib/rutas'
import {
  cerrarSesionLocal,
  leerToken,
  zonaPorRuta,
  type ZonaApi,
} from './almacenamientoSesion'

export interface ErrorApi {
  status: number
  mensaje: string
  campos?: string[]
}

export class ErrorPeticion extends Error implements ErrorApi {
  readonly status: number
  readonly mensaje: string
  readonly campos?: string[]

  constructor({ status, mensaje, campos }: ErrorApi) {
    super(mensaje)
    this.name = 'ErrorPeticion'
    this.status = status
    this.mensaje = mensaje
    this.campos = campos
  }
}

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface OpcionesPeticion {
  metodo?: MetodoHttp
  cuerpo?: unknown
  zona?: ZonaApi
  signal?: AbortSignal
  headers?: HeadersInit
  /** El login no debe redirigir: ya está en la pantalla de acceso. */
  redirigirEn401?: boolean
}

const MENSAJE_GENERICO = 'Algo salió mal. Inténtalo de nuevo.'
const MENSAJE_RED = 'No pudimos conectar. Revisa tu internet.'

function construirUrl(ruta: string): string {
  const base = import.meta.env.VITE_API_URL?.trim()
  if (!base) {
    throw new ErrorPeticion({
      status: 0,
      mensaje: 'Falta configurar VITE_API_URL en el archivo .env.',
    })
  }
  return `${base.replace(/\/$/, '')}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return texto
  }
}

function normalizarError(status: number, cuerpo: unknown): ErrorPeticion {
  if (typeof cuerpo === 'object' && cuerpo !== null) {
    const datos = cuerpo as Record<string, unknown>
    const mensajeCrudo = datos.message ?? datos.mensaje
    if (Array.isArray(mensajeCrudo)) {
      const campos = mensajeCrudo.filter((item): item is string => typeof item === 'string')
      return new ErrorPeticion({
        status,
        mensaje: campos[0] ?? MENSAJE_GENERICO,
        campos,
      })
    }
    if (typeof mensajeCrudo === 'string' && mensajeCrudo.trim()) {
      return new ErrorPeticion({ status, mensaje: mensajeCrudo, campos: undefined })
    }
  }

  if (typeof cuerpo === 'string' && cuerpo.trim()) {
    return new ErrorPeticion({ status, mensaje: cuerpo.trim() })
  }
  return new ErrorPeticion({ status, mensaje: MENSAJE_GENERICO })
}

export function construirDestinoLogin(
  zona: Exclude<ZonaApi, 'publico'>,
  motivo: string,
  rutaActual: string,
): string {
  const destino = zona === 'admin' ? '/admin/login' : '/login'
  const parametros = new URLSearchParams({ motivo })
  if (zona !== 'admin') {
    const volver = volverSeguro(rutaActual)
    if (volver) parametros.set('volver', volver)
  }
  return `${destino}?${parametros.toString()}`
}

function redirigirAlLogin(zona: Exclude<ZonaApi, 'publico'>, motivo: string): void {
  if (typeof window === 'undefined') return

  const destino = zona === 'admin' ? '/admin/login' : '/login'
  if (window.location.pathname === destino) return

  const rutaActual = `${window.location.pathname}${window.location.search}`
  window.location.assign(construirDestinoLogin(zona, motivo, rutaActual))
}

function esCuentaNoActiva(mensaje: string): boolean {
  return /cuenta no activa|cuenta (está|esta) suspendida|suspendida o vencida|cuenta.*vencida/i.test(
    mensaje,
  )
}

/**
 * Petición JSON contra VITE_API_URL. Inyecta el token de la zona, normaliza los
 * errores a { status, mensaje, campos? } y maneja 401 / 403 de cuenta inactiva.
 */
export async function peticion<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const zona = opciones.zona ?? zonaPorRuta(ruta)
  const token = leerToken(zona)
  const headers = new Headers(opciones.headers)

  headers.set('Accept', 'application/json')
  if (opciones.cuerpo !== undefined && !(opciones.cuerpo instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta), {
      method: opciones.metodo ?? 'GET',
      headers,
      body:
        opciones.cuerpo === undefined
          ? undefined
          : opciones.cuerpo instanceof FormData
            ? opciones.cuerpo
            : JSON.stringify(opciones.cuerpo),
      signal: opciones.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof ErrorPeticion) throw error
    throw new ErrorPeticion({ status: 0, mensaje: MENSAJE_RED })
  }

  if (respuesta.status === 204 || respuesta.status === 205) {
    return undefined as T
  }

  const cuerpo = await leerCuerpo(respuesta)

  if (respuesta.ok) {
    return cuerpo as T
  }

  const error = normalizarError(respuesta.status, cuerpo)

  if (respuesta.status === 401 && opciones.redirigirEn401 !== false && zona !== 'publico') {
    cerrarSesionLocal(zona, 'expirada')
    redirigirAlLogin(zona, 'sesion-expirada')
  }

  if (respuesta.status === 403 && zona !== 'publico' && esCuentaNoActiva(error.mensaje)) {
    cerrarSesionLocal(zona, 'cuenta-no-activa')
    redirigirAlLogin(zona, 'cuenta-no-activa')
  }

  throw error
}
