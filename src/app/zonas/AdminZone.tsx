import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { NoEncontrada } from '../NoEncontrada'
import { PantallaEnConstruccion } from '../PantallaEnConstruccion'

export default function AdminZone() {
  return (
    <Routes>
      <Route path="admin" element={<AdminLayout />}>
        <Route
          index
          element={<PantallaEnConstruccion eyebrow="PLATAFORMA" titulo="Barberos" />}
        />
        <Route
          path="login"
          element={
            <PantallaEnConstruccion
              eyebrow="ADMINISTRACIÓN"
              titulo="Acceso de administrador"
            />
          }
        />
        <Route
          path="barberos/:id"
          element={
            <PantallaEnConstruccion
              eyebrow="ADMINISTRACIÓN"
              titulo="Detalle del barbero"
            />
          }
        />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
