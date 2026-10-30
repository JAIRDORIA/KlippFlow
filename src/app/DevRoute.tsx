import { lazy, Suspense } from 'react'
import { CargandoRuta } from './CargandoRuta'

const DevPage = lazy(() => import('@/dev/DevPage'))

export function DevRoute() {
  return (
    <Suspense fallback={<CargandoRuta />}>
      <DevPage />
    </Suspense>
  )
}
