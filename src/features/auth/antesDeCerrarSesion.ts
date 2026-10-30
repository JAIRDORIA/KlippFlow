export type TareaAntesDeCerrarSesion = () => void | Promise<void>

const tareas = new Set<TareaAntesDeCerrarSesion>()

/**
 * Punto de extensión para tareas que deben ejecutarse antes de borrar la
 * sesión (por ejemplo, anular la suscripción push en el siguiente prompt).
 * Devuelve la función para desregistrar la tarea.
 */
export function registrarAntesDeCerrarSesion(
  tarea: TareaAntesDeCerrarSesion,
): () => void {
  tareas.add(tarea)
  return () => {
    tareas.delete(tarea)
  }
}

/** Ejecuta todas las tareas con tolerancia a fallos (nunca rechaza). */
export async function ejecutarAntesDeCerrarSesion(): Promise<void> {
  const pendientes = Array.from(tareas).map(async (tarea) => tarea())
  await Promise.allSettled(pendientes)
}
