import { Home, Inbox, Settings, ShoppingBag, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Badge } from './Badge'

export interface BottomNavProps {
  solicitudesPendientes: number
  className?: string
  /** En /dev se muestra dentro del flujo, no fija al viewport. */
  fija?: boolean
}

const pestanas = [
  { ruta: '/app/hoy', etiqueta: 'Hoy', Icono: Home },
  { ruta: '/app/solicitudes', etiqueta: 'Solicitudes', Icono: Inbox, badge: true },
  { ruta: '/app/cuentas', etiqueta: 'Cuentas', Icono: Wallet },
  { ruta: '/app/compras', etiqueta: 'Compras', Icono: ShoppingBag },
  { ruta: '/app/ajustes', etiqueta: 'Ajustes', Icono: Settings },
] as const

export function BottomNav({
  solicitudesPendientes,
  className,
  fija = true,
}: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'w-full max-w-[var(--width-shell)]',
        'border-t border-line bg-nav backdrop-blur-[var(--blur-nav)]',
        'pb-[env(safe-area-inset-bottom)]',
        fija &&
          'fixed bottom-0 left-1/2 z-[var(--z-nav)] -translate-x-1/2 min-[900px]:bottom-6 min-[900px]:rounded-b-[var(--radius-shell)]',
        className,
      )}
    >
      <ul className="flex min-h-[var(--height-nav)] items-stretch">
        {pestanas.map(({ ruta, etiqueta, Icono, ...extra }) => {
          const conBadge = 'badge' in extra && extra.badge
          return (
            <li key={ruta} className="flex flex-1">
              <NavLink
                to={ruta}
                className={({ isActive }) =>
                  cn(
                    'type-nav flex min-h-[var(--height-button-compact)] flex-1 flex-col items-center justify-center gap-1 px-1',
                    isActive ? 'text-accent' : 'text-dim',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative inline-flex">
                      <Icono
                        aria-hidden="true"
                        size={22}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {conBadge && (
                        <Badge
                          cantidad={solicitudesPendientes}
                          className="absolute -right-3 -top-2"
                        />
                      )}
                    </span>
                    <span className={isActive ? 'text-accent' : undefined}>{etiqueta}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
