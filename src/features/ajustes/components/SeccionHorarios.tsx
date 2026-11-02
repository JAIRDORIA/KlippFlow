import { useMemo } from 'react'
import { filasDeHorario } from '@/features/ajustes/domain/horarios'
import { useHorarios } from '@/features/ajustes/hooks'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Skeleton } from '@/shared/ui/Skeleton'
import { FilaDia } from './FilaDia'

/** Editor de horarios: 7 días con guardado explícito por día. */
export function SeccionHorarios() {
  const { data, isPending, isError, isFetching, refetch } = useHorarios()

  const filas = useMemo(() => filasDeHorario(data ?? []), [data])

  return (
    <section className="mt-9">
      <h2 className="type-card-title">Horarios</h2>
      <p className="type-helper mt-2">
        Una cita puede terminar hasta 20 min después de cerrar un bloque, sin invadir
        el siguiente.
      </p>

      {isPending && (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[72px] w-full" />
        </div>
      )}

      {isError && !data && (
        <div className="mt-3">
          <EstadoError
            mensaje="No pudimos cargar tus horarios. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {data && (
        <ul className="mt-2">
          {filas.map((fila) => (
            <FilaDia key={fila.diaSemana} fila={fila} />
          ))}
        </ul>
      )}
    </section>
  )
}
