import {
  celularValido,
  normalizarCelular,
} from '@/features/reserva-publica/domain/celular'
import type { ActualizarWhatsappBody } from '../types'

export const MENSAJE_CELULAR_INVALIDO =
  'Escribe un celular de 10 dígitos que empiece por 3.'

export const MENSAJE_ACTIVAR_SIN_CELULAR =
  'Escribe un celular válido para activar los recordatorios.'

export interface ErroresWhatsapp {
  celular?: string
  activo?: string
}

/**
 * Validación local de la tarjeta de Ajustes.
 *
 * Reutiliza la normalización de la reserva pública (10 dígitos que empiezan por
 * 3, acepta `+57` y espacios). Activar exige un celular válido en el mismo
 * guardado, igual que `PUT /barbero/configuracion/whatsapp`.
 */
export function validarWhatsapp(
  celular: string,
  activo: boolean,
): ErroresWhatsapp {
  const errores: ErroresWhatsapp = {}
  const limpio = celular.trim()

  if (limpio && !celularValido(limpio)) {
    errores.celular = MENSAJE_CELULAR_INVALIDO
  }

  if (activo && !celularValido(limpio)) {
    errores.activo = MENSAJE_ACTIVAR_SIN_CELULAR
  }

  return errores
}

export function esWhatsappValido(celular: string, activo: boolean): boolean {
  return Object.keys(validarWhatsapp(celular, activo)).length === 0
}

/** El interruptor solo puede encenderse con un celular que ya normalice. */
export function puedeActivarWhatsapp(celular: string): boolean {
  return celularValido(celular)
}

/**
 * Cuerpo exacto del PUT. Devuelve `null` si el borrador no se puede guardar.
 *
 * `celular` se omite al apagar sin número escrito: el backend documenta que
 * `activo: false` sin `celular` conserva el número guardado. Enviar una cadena
 * inválida responde 400 incluso con `activo: false`.
 */
export function construirCuerpoWhatsapp(
  celular: string,
  activo: boolean,
): ActualizarWhatsappBody | null {
  const normalizado = normalizarCelular(celular)

  if (activo) {
    return normalizado ? { celular: normalizado, activo: true } : null
  }

  if (!celular.trim()) return { activo: false }
  return normalizado ? { celular: normalizado, activo: false } : null
}
