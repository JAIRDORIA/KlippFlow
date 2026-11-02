import { Navigate, Route, Routes } from 'react-router-dom'
import { HoyPage } from '@/features/agenda/HoyPage'
import { AjustesPage } from '@/features/ajustes/AjustesPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { CuentasPage } from '@/features/cuentas/CuentasPage'
import { InstalarPage } from '@/features/notificaciones/InstalarPage'
import { SincronizadorNotificaciones } from '@/features/notificaciones/SincronizadorNotificaciones'
import { SolicitudesPage } from '@/features/solicitudes/SolicitudesPage'
import { AppLayout } from '../layouts/AppLayout'
import { NoEncontrada } from '../NoEncontrada'

export default function BarberZone() {
  return (
    <>
      {/* Re-sincroniza el push al entrar y lo da de baja al cerrar sesión. */}
      <SincronizadorNotificaciones />

      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          path="instalar"
          element={
            <ProtectedRoute>
              <InstalarPage />
            </ProtectedRoute>
          }
        />
        {/* Alias por compatibilidad: la ruta canónica es /instalar. */}
        <Route path="app/instalar" element={<Navigate to="/instalar" replace />} />
        <Route
          path="app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="hoy" replace />} />
          <Route path="hoy" element={<HoyPage />} />
          <Route path="solicitudes" element={<SolicitudesPage />} />
          <Route path="cuentas" element={<CuentasPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="ajustes" element={<AjustesPage />} />
          <Route path="*" element={<NoEncontrada conNav />} />
        </Route>
      </Routes>
    </>
  )
}
