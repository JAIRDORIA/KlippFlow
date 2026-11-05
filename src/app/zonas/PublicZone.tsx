import { Route, Routes } from 'react-router-dom'
import { RutaCliente } from '@/features/auth/ProtectedRoute'
import { CompletarCuentaPage } from '@/features/cuentas-cliente/CompletarCuentaPage'
import { MiCitaDetallePage } from '@/features/cuentas-cliente/MiCitaDetallePage'
import { MiCitasPage } from '@/features/cuentas-cliente/MiCitasPage'
import { MiInstalarPage } from '@/features/cuentas-cliente/MiInstalarPage'
import { MiPage } from '@/features/cuentas-cliente/MiPage'
import { NuevaContrasenaPage } from '@/features/cuentas-cliente/NuevaContrasenaPage'
import { useInvalidarCitasPush } from '@/features/cuentas-cliente/useInvalidarCitasPush'
import { PrivacidadPage } from '@/features/legal/PrivacidadPage'
import { MiSeguridadPage } from '@/features/passkeys/MiSeguridadPage'
import { SincronizadorNotificaciones } from '@/features/notificaciones/SincronizadorNotificaciones'
import { CodigoPage } from '@/features/reserva-publica/CodigoPage'
import { ReservaPage } from '@/features/reserva-publica/ReservaPage'
import { SeguimientoPage } from '@/features/reserva-publica/SeguimientoPage'

function SincronizadorCliente() {
  useInvalidarCitasPush()
  return <SincronizadorNotificaciones rol="cliente" />
}

export default function PublicZone() {
  return (
    <>
      <SincronizadorCliente />

      <Routes>
        <Route path="privacidad" element={<PrivacidadPage />} />
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
          path="mi/citas"
          element={
            <RutaCliente>
              <MiCitasPage />
            </RutaCliente>
          }
        />
        <Route
          path="mi/citas/:id"
          element={
            <RutaCliente>
              <MiCitaDetallePage />
            </RutaCliente>
          }
        />
        <Route
          path="mi/instalar"
          element={
            <RutaCliente>
              <MiInstalarPage />
            </RutaCliente>
          }
        />
        <Route
          path="mi/seguridad"
          element={
            <RutaCliente>
              <MiSeguridadPage />
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
    </>
  )
}
