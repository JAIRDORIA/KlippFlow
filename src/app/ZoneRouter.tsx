import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { Spinner } from '@/shared/ui/Spinner'
import { NoEncontrada } from './NoEncontrada'

const BarberZone = lazy(() => import('./zonas/BarberZone'))
const PublicZone = lazy(() => import('./zonas/PublicZone'))
const AdminZone = lazy(() => import('./zonas/AdminZone'))

function CargandoPantalla() {
  return (
    <main className="flex min-h-[calc(100dvh-48px)] items-center justify-center max-[899px]:min-h-dvh">
      <Spinner tamano={24} etiqueta="Cargando pantalla" />
    </main>
  )
}

function zonaDeRuta(pathname: string): 'barbero' | 'publico' | 'admin' | 'desconocida' {
  if (
    pathname === '/login' ||
    pathname === '/instalar' ||
    pathname === '/app' ||
    pathname.startsWith('/app/')
  ) {
    return 'barbero'
  }
  if (
    pathname === '/b' ||
    pathname.startsWith('/b/') ||
    pathname.startsWith('/cita/')
  ) {
    return 'publico'
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin'
  return 'desconocida'
}

export function ZoneRouter() {
  const { pathname } = useLocation()
  const normalizada = pathname.replace(/\/+$/, '') || '/'
  const zona = zonaDeRuta(normalizada)

  if (zona === 'desconocida') return <NoEncontrada />

  return (
    <Suspense fallback={<CargandoPantalla />}>
      {zona === 'barbero' && <BarberZone />}
      {zona === 'publico' && <PublicZone />}
      {zona === 'admin' && <AdminZone />}
    </Suspense>
  )
}
