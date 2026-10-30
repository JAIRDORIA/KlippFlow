import { Outlet } from 'react-router-dom'

/** Layout simple y propio del panel de administración (sin barra inferior). */
export function AdminLayout() {
  return (
    <div className="min-h-[inherit]">
      <header className="flex min-h-[var(--height-nav)] items-center justify-between gap-4 border-b border-line px-[var(--space-screen-x)] pt-[env(safe-area-inset-top)]">
        <p className="type-small font-medium text-text">
          KlippFlow <span className="text-dim">· Administración</span>
        </p>
        <p className="type-eyebrow">ADMIN</p>
      </header>
      <Outlet />
    </div>
  )
}
