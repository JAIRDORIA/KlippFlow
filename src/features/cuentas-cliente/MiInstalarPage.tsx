import { useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { PasosInstalacion } from '@/features/notificaciones/components/PasosInstalacion'
import {
  leerEntornoDispositivo,
  plataformaPush,
} from '@/features/notificaciones/domain/plataforma'
import { Button } from '@/shared/ui/Button'
import { Logo } from '@/shared/ui/Logo'
import { AvisoActivarApp } from './components/AvisoActivarApp'

/** Onboarding de instalación/notificaciones para clientes (`/mi/instalar`). */
export function MiInstalarPage() {
  useTituloPagina()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const plataforma = useMemo(
    () => plataformaPush(leerEntornoDispositivo()),
    [],
  )

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi%2Finstalar" replace />
  }

  const esIosNavegador = plataforma === 'ios-navegador'

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col">
        <Logo tamano="md" decorativo />

        <h1 className="type-public-title mt-6">
          {esIosNavegador
            ? 'Instala la app para recibir el aviso cuando el barbero responda'
            : 'Activa las notificaciones de tu cuenta de cliente'}
        </h1>

        <p className="type-form mt-4 text-secondary">
          {esIosNavegador
            ? 'En iPhone, las notificaciones solo funcionan si KlippFlow está en tu pantalla de inicio (iOS 16.4 o superior).'
            : 'Te avisaremos cuando el barbero acepte o rechace tu solicitud.'}
        </p>

        {esIosNavegador ? (
          <>
            <PasosInstalacion pasoCuatroPendiente />

            <p className="type-helper mt-4">
              Al abrir la app instalada, vuelve a iniciar sesión con tu usuario y
              contraseña.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <Button onClick={() => navegar('/mi', { replace: true })} className="w-full">
                Ya la instalé, continuar
              </Button>
              <Button
                variante="ghost"
                onClick={() => navegar('/mi', { replace: true })}
                className="w-full"
              >
                Ahora no
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8">
              <AvisoActivarApp contexto="confirmacion" clienteId={usuario.id} />
            </div>

            <Button
              onClick={() => navegar('/mi', { replace: true })}
              className="mt-6 w-full"
            >
              Ir a mis citas
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
