import { Route, Routes } from 'react-router-dom'
import { RutaCliente } from '@/features/auth/ProtectedRoute'
import { CompletarCuentaPage } from '@/features/cuentas-cliente/CompletarCuentaPage'
import { MiPage } from '@/features/cuentas-cliente/MiPage'
import { NuevaContrasenaPage } from '@/features/cuentas-cliente/NuevaContrasenaPage'
import { CodigoPage } from '@/features/reserva-publica/CodigoPage'
import { ReservaPage } from '@/features/reserva-publica/ReservaPage'
import { SeguimientoPage } from '@/features/reserva-publica/SeguimientoPage'

export default function PublicZone() {
  return (
    <Routes>
      <Route path="b" element={<CodigoPage />} />
      <Route path="b/:codigo" element={<ReservaPage />} />
      <Route path="cita/:token" element={<SeguimientoPage />} />
      <Route
        path="mi"
        element={
          <RutaCliente>
            <MiPage />
          </RutaCliente>
        }
      />
      <Route
        path="mi/nueva-contrasena"
        element={
          <RutaCliente>
            <NuevaContrasenaPage />
          </RutaCliente>
        }
      />
      <Route path="registro/completar" element={<CompletarCuentaPage />} />
    </Routes>
  )
}
