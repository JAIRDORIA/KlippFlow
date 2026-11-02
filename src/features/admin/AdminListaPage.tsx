import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useAdminAuth } from '@/features/auth/useAdminAuth'
import { useBarberos } from './hooks'
import {
  contarPorEstado,
  filtrarBarberos,
  type FiltroEstado,
} from './domain/lista'
import { nombreCompleto } from './domain/texto'
import type { BarberoAdmin } from './types'
import { PildoraEstado } from './components/PildoraEstado'
import { SheetDetalleBarbero } from './components/SheetDetalleBarbero'
import { SheetNuevoBarbero } from './components/SheetNuevoBarbero'

/** Lista de barberos del panel (`/admin`). */
export function AdminListaPage() {
  const { cerrarSesion } = useAdminAuth()
  const { data, isPending, isError, isFetching, refetch } = useBarberos()

  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('todos')
  const [nuevoAbierto, setNuevoAbierto] = useState(false)
  const [detalle, setDetalle] = useState<BarberoAdmin | null>(null)

  const barberos = data?.barberos ?? []
  const conteos = contarPorEstado(barberos)
  const filtrados = filtrarBarberos(barberos, { estado, busqueda })
  const hayFiltros = estado !== 'todos' || busqueda.trim().length > 0

  const opciones: Array<{ valor: FiltroEstado; etiqueta: string; conteo: number }> = [
    { valor: 'todos', etiqueta: 'Todos', conteo: conteos.todos },
    { valor: 'activo', etiqueta: 'Activos', conteo: conteos.activo },
    { valor: 'suspendido', etiqueta: 'Suspendidos', conteo: conteos.suspendido },
    { valor: 'vencido', etiqueta: 'Vencidos', conteo: conteos.vencido },
  ]

  function limpiarFiltros(): void {
    setBusqueda('')
    setEstado('todos')
  }

  return (
    <main className="screen">

      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="type-eyebrow">ADMINISTRACIÓN</p>
              <h1 className="type-screen-title mt-2">Barberos</h1>
            </div>

            <Button
              variante="ghost"
              tamano="compacto"
              onClick={cerrarSesion}
              className="shrink-0"
            >
              Cerrar sesión
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="type-helper">
              {data
                ? `${conteos.todos} ${conteos.todos === 1 ? 'barbero' : 'barberos'}`
                : ' '}
            </p>
            <Button
              tamano="compacto"
              onClick={() => setNuevoAbierto(true)}
              className="shrink-0"
            >
              + Nuevo barbero
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <Input
            etiqueta="Buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre, barbería o usuario"
            autoComplete="off"
          />

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por estado"
          >
            {opciones.map((opcion) => {
              const activa = estado === opcion.valor
              return (
                <button
                  key={opcion.valor}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setEstado(opcion.valor)}
                  className="kf-press inline-flex min-h-[var(--height-button-compact)] items-center rounded-[var(--radius-pill)]"
                >
                  <Chip variante={activa ? 'hueso' : 'neutro'}>
                    {opcion.etiqueta}
                    <span className="font-mono">{opcion.conteo}</span>
                  </Chip>
                </button>
              )
            })}
          </div>
        </div>

        {isPending && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
          </div>
        )}

        {isError && !data && (
          <EstadoError
            mensaje="No pudimos cargar los barberos. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        )}

        {data && barberos.length === 0 && (
          <EmptyState
            titulo="Aún no hay barberos"
            descripcion="Crea el primer barbero para que pueda recibir reservas."
            accion={
              <Button tamano="compacto" onClick={() => setNuevoAbierto(true)}>
                + Nuevo barbero
              </Button>
            }
          />
        )}

        {data && barberos.length > 0 && filtrados.length === 0 && (
          <EmptyState
            titulo="Sin resultados"
            descripcion="Ningún barbero coincide con la búsqueda o el filtro."
            accion={
              <Button variante="ghost" tamano="compacto" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            }
          />
        )}

        {filtrados.length > 0 && (
          <ul className="flex flex-col gap-2">
            {filtrados.map((barbero) => (
              <li key={barbero.id}>
                <button
                  type="button"
                  onClick={() => setDetalle(barbero)}
                  className="kf-press flex w-full items-start justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-card px-[var(--space-card)] py-[var(--space-gap-lg)] text-left hover:bg-elevated"
                >
                  <span className="min-w-0 flex-1">
                    <span className="type-form block truncate font-medium text-text">
                      {nombreCompleto(barbero)}
                    </span>
                    {barbero.nombreBarberia && (
                      <span className="type-helper mt-1 block truncate">
                        {barbero.nombreBarberia}
                      </span>
                    )}
                    <span className="type-helper mt-2 block truncate font-mono">
                      {barbero.username} · {barbero.codigoUnico}
                    </span>
                  </span>

                  <span className="shrink-0">
                    <PildoraEstado estado={barbero.estadoCuenta} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {data && data.total > barberos.length && (
          <p className="type-helper">
            Mostrando los primeros {barberos.length} de {data.total}. Usa la
            búsqueda para encontrar a los demás.
          </p>
        )}

        {hayFiltros && filtrados.length > 0 && (
          <p className="type-helper" role="status">
            {filtrados.length} de {barberos.length} barberos.
          </p>
        )}
      </div>

      {nuevoAbierto && (
        <SheetNuevoBarbero onCerrar={() => setNuevoAbierto(false)} />
      )}

      {detalle && (
        <SheetDetalleBarbero
          barbero={detalle}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </main>
  )
}
