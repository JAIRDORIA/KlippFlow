import { cn } from '@/shared/lib/cn'
import { IconoPaso, type TipoPaso } from './IconoPaso'

interface Paso {
  tipo: TipoPaso
  titulo: string
  detalle: string
}

const PASOS: readonly Paso[] = [
  {
    tipo: 'compartir',
    titulo: 'Toca Compartir',
    detalle: 'En Safari, el ícono de compartir está en la barra inferior.',
  },
  {
    tipo: 'agregar',
    titulo: 'Añadir a pantalla de inicio',
    detalle: 'Desliza la hoja y elige "Añadir a pantalla de inicio".',
  },
  {
    tipo: 'abrir',
    titulo: 'Abre KlippFlow desde el ícono',
    detalle: 'Es la única forma de recibir notificaciones en iPhone.',
  },
  {
    tipo: 'notificaciones',
    titulo: 'Activa las notificaciones',
    detalle: 'Al abrirla desde el ícono te pediremos permiso.',
  },
]

export interface PasosInstalacionProps {
  /** En iPhone sin instalar el paso 4 todavía no se puede completar. */
  pasoCuatroPendiente: boolean
}

export function PasosInstalacion({ pasoCuatroPendiente }: PasosInstalacionProps) {
  return (
    <ol className="mt-8 flex flex-col">
      {PASOS.map((paso, indice) => {
        const numero = String(indice + 1).padStart(2, '0')
        const pendiente = pasoCuatroPendiente && indice === 3

        return (
          <li
            key={paso.tipo}
            className={cn(
              'flex items-start gap-4 border-b border-line py-4 last:border-b-0',
              pendiente && 'opacity-[var(--opacity-inactive)]',
            )}
          >
            <span className="type-helper shrink-0 font-mono text-dim">{numero}</span>

            <div className="min-w-0 flex-1">
              <p className="type-form font-medium text-text">{paso.titulo}</p>
              <p className="type-helper mt-1">{paso.detalle}</p>
              {pendiente && (
                <p className="type-helper mt-1 text-secondary">
                  Disponible cuando abras la app desde el ícono.
                </p>
              )}
            </div>

            <span className="shrink-0 text-dim">
              <IconoPaso tipo={paso.tipo} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}
