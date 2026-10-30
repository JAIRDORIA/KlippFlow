import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { eyebrowFecha, hoyBogota } from '@/shared/lib/fechas'
import { AppLayout } from '../layouts/AppLayout'
import { NoEncontrada } from '../NoEncontrada'
import { PantallaEnConstruccion } from '../PantallaEnConstruccion'

export default function BarberZone() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        path="instalar"
        element={
          <ProtectedRoute>
            <PantallaEnConstruccion
              eyebrow="ANTES DE EMPEZAR · 1 MINUTO"
              titulo="Instala la app para no perder ninguna cita"
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="hoy" replace />} />
        <Route
          path="hoy"
          element={
            <PantallaEnConstruccion
              conNav
              eyebrow={eyebrowFecha(hoyBogota())}
              titulo="Hoy"
            />
          }
        />
        <Route
          path="solicitudes"
          element={
            <PantallaEnConstruccion
              conNav
              eyebrow="ORDENADAS POR URGENCIA"
              titulo="Solicitudes"
            />
          }
        />
        <Route
          path="cuentas"
          element={
            <PantallaEnConstruccion
              conNav
              eyebrow="HOY · SE REINICIA 12:00 A. M. BOGOTÁ"
              titulo="Cuentas"
            />
          }
        />
        <Route
          path="compras"
          element={
            <PantallaEnConstruccion
              conNav
              eyebrow="INSUMOS · SALIDA DE CAJA"
              titulo="Compras"
            />
          }
        />
        <Route
          path="ajustes"
          element={
            <PantallaEnConstruccion
              conNav
              eyebrow="TU CUENTA · CONFIGURACIÓN"
              titulo="Ajustes"
            />
          }
        />
        <Route path="*" element={<NoEncontrada conNav />} />
      </Route>
    </Routes>
  )
}
