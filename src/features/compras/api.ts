import { peticion } from '@/shared/api/client'
import type {
  CrearCompraBody,
  EditarCompraBody,
  ListaCompras,
  RespuestaCompra,
} from './types'

/**
 * Endpoints de compras.
 * Fuente: `docs/backend/COMPRAS_Y_BALANCE.md`. El `barberoId` y la
 * `fechaBalance` nunca se envían: los pone el servidor.
 */

function rutaCompra(id: number): string {
  return `/barbero/compras/${encodeURIComponent(String(id))}`
}

/** `fecha` opcional; sin ella el backend usa hoy. */
export function obtenerCompras(fecha?: string): Promise<ListaCompras> {
  const consulta = fecha ? `?${new URLSearchParams({ fecha }).toString()}` : ''
  return peticion<ListaCompras>(`/barbero/compras${consulta}`, { zona: 'barbero' })
}

export function crearCompra(cuerpo: CrearCompraBody): Promise<RespuestaCompra> {
  return peticion<RespuestaCompra>('/barbero/compras', {
    metodo: 'POST',
    cuerpo,
    zona: 'barbero',
  })
}

export function editarCompra(
  id: number,
  cambios: EditarCompraBody,
): Promise<RespuestaCompra> {
  return peticion<RespuestaCompra>(rutaCompra(id), {
    metodo: 'PATCH',
    cuerpo: cambios,
    zona: 'barbero',
  })
}

/** 204 sin cuerpo. */
export async function eliminarCompra(id: number): Promise<void> {
  await peticion<void>(rutaCompra(id), { metodo: 'DELETE', zona: 'barbero' })
}
