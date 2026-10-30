import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { DevRoute } from './DevRoute'
import { RootRedirect } from './RootRedirect'
import { ZoneRouter } from './ZoneRouter'

const rutas: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  ...(import.meta.env.DEV ? [{ path: '/dev', element: <DevRoute /> }] : []),
  { path: '/*', element: <ZoneRouter /> },
]

export const router = createBrowserRouter(rutas)
