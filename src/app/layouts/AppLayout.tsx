import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/shared/ui/BottomNav'

/** Layout del barbero: las cinco pestañas con badge de solicitudes. */
export function AppLayout() {
  return (
    <div className="relative min-h-[inherit]">
      <Outlet />
      <BottomNav solicitudesPendientes={0} />
    </div>
  )
}
