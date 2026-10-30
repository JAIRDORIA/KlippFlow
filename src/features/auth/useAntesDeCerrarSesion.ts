import { useEffect } from 'react'
import {
  registrarAntesDeCerrarSesion,
  type TareaAntesDeCerrarSesion,
} from './antesDeCerrarSesion'

/** Hook de conveniencia para registrar una tarea antes de cerrar sesión. */
export function useAntesDeCerrarSesion(tarea: TareaAntesDeCerrarSesion): void {
  useEffect(() => registrarAntesDeCerrarSesion(tarea), [tarea])
}
