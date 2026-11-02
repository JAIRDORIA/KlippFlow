import { nombreCompleto } from './texto'

/**
 * Texto listo para pegar en WhatsApp con los datos de entrega de un barbero.
 * Solo se construye en el cliente: no se guarda ni se envía a ningún sitio.
 */

export interface DatosEntrega {
  nombres: string
  apellidos: string
  username: string
  /** Contraseña provisional; se omite si no aplica. */
  password?: string | null
  codigoUnico: string
  linkReservas: string
}

export function textoEntrega(datos: DatosEntrega): string {
  const lineas = [
    'KlippFlow · datos de acceso',
    '',
    `Hola ${nombreCompleto(datos)}:`,
    `Usuario: ${datos.username}`,
  ]

  const password = datos.password?.trim()
  if (password) lineas.push(`Contraseña: ${password}`)

  lineas.push(
    `Código de reservas: ${datos.codigoUnico}`,
    `Link para tus clientes: ${datos.linkReservas}`,
    '',
    'Guarda estos datos. La contraseña no se vuelve a mostrar.',
  )

  return lineas.join('\n')
}
