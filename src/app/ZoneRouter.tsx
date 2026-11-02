import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { Spinner } from '@/shared/ui/Spinner'
import { MetaNoIndex } from './MetaNoIndex'
import { NoEncontrada } from './NoEncontrada'
import { zonaDeRuta } from './rutas'

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

export function ZoneRouter() {
  const { pathname } = useLocation()
  const zona = zonaDeRuta(pathname)

  return (
    <>
      {/* Un solo lugar decide el noindex de cada ruta (ver rutas.ts). */}
      <MetaNoIndex />

      {zona === 'desconocida' ? (
        <NoEncontrada />
      ) : (
        // Frontera por zona: si una pantalla falla, el resto de la app sigue
        // viva y al cambiar de zona la frontera se reinicia.
        <ErrorBoundary key={zona}>
          <Suspense fallback={<CargandoPantalla />}>
            {zona === 'barbero' && <BarberZone />}
            {zona === 'publico' && <PublicZone />}
            {zona === 'admin' && <AdminZone />}
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  )
}
