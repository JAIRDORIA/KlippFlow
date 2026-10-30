import { describe, expect, it, vi } from 'vitest'
import {
  ejecutarAntesDeCerrarSesion,
  registrarAntesDeCerrarSesion,
} from './antesDeCerrarSesion'

describe('tareas antes de cerrar sesión', () => {
  it('ejecuta todas las tareas aunque una falle', async () => {
    const orden: string[] = []
    const desregistrarA = registrarAntesDeCerrarSesion(async () => {
      orden.push('push')
    })
    const desregistrarB = registrarAntesDeCerrarSesion(() => {
      orden.push('otra')
      throw new Error('falla simulada')
    })

    await expect(ejecutarAntesDeCerrarSesion()).resolves.toBeUndefined()
    expect(orden).toEqual(['push', 'otra'])

    desregistrarA()
    desregistrarB()
  })

  it('permite desregistrar una tarea', async () => {
    const tarea = vi.fn()
    const desregistrar = registrarAntesDeCerrarSesion(tarea)
    desregistrar()

    await ejecutarAntesDeCerrarSesion()
    expect(tarea).not.toHaveBeenCalled()
  })
})
