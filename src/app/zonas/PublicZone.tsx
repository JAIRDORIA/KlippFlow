import { Route, Routes } from 'react-router-dom'
import { CodigoPage } from '@/features/reserva-publica/CodigoPage'
import { ReservaPage } from '@/features/reserva-publica/ReservaPage'
import { SeguimientoPage } from '@/features/reserva-publica/SeguimientoPage'

export default function PublicZone() {
  return (
    <Routes>
      <Route path="b" element={<CodigoPage />} />
      <Route path="b/:codigo" element={<ReservaPage />} />
      <Route path="cita/:token" element={<SeguimientoPage />} />
    </Routes>
  )
}
