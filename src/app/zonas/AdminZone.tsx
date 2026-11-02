import { Route, Routes } from 'react-router-dom'
import { AdminListaPage } from '@/features/admin/AdminListaPage'
import { AdminLoginPage } from '@/features/admin/AdminLoginPage'
import { AdminAuthProvider } from '@/features/auth/AdminAuthProvider'
import { ProtectedAdminRoute } from '@/features/auth/ProtectedAdminRoute'
import { AdminLayout } from '../layouts/AdminLayout'
import { NoEncontrada } from '../NoEncontrada'

export default function AdminZone() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />

        <Route
          path="admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<AdminListaPage />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}
