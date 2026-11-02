import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PREFIJO_BARBERO } from '@/features/agenda/claves'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useSolicitudes } from '@/features/solicitudes/hooks'
import { BottomNav } from '@/shared/ui/BottomNav'

/**
 * Layout del barbero: las cinco pestañas con el badge de solicitudes.
 *
 * La consulta de solicitudes se monta aquí para que el badge esté al día en
 * cualquier pestaña, y cada cambio de pestaña refresca las consultas activas del
 * barbero (agenda, solicitudes, balance e historial de Cuentas y compras del
 * día), además del foco de ventana y del sondeo de 60 s de los hooks.
 */
export function AppLayout() {
  useTituloPagina()
  const { data } = useSolicitudes()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const rutaPrevia = useRef(pathname)

  useEffect(() => {
    if (rutaPrevia.current === pathname) return
    rutaPrevia.current = pathname

    void queryClient.refetchQueries({
      queryKey: PREFIJO_BARBERO,
      type: 'active',
    })
  }, [pathname, queryClient])

  return (
    <div className="relative min-h-[inherit]">
      <Outlet />
      <BottomNav solicitudesPendientes={data?.length ?? 0} />
    </div>
  )
}
