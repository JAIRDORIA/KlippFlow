import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { Button } from '@/shared/ui/Button'
import { Logo } from '@/shared/ui/Logo'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { PasosInstalacion } from './components/PasosInstalacion'
import { PasoNotificaciones } from './components/PasoNotificaciones'
import { almacenDelNavegador, guardarDescarte } from './domain/onboarding'
import { detectarDispositivo, leerEntornoDispositivo } from './domain/plataforma'

/**
 * Onboarding de instalación y activación (`/instalar`, DISENO.md 6.2).
 *
 * - En iPhone sin instalar: los cuatro pasos; el botón principal explica que hay
 *   que abrir la app desde el ícono.
 * - En iPhone instalado, Android o escritorio: solo el paso de notificaciones.
 * - Nunca bloquea: siempre se puede seguir a Hoy.
 */
export function InstalarPage() {
  useTituloPagina()
  const navegar = useNavigate()
  const deteccion = useMemo(() => detectarDispositivo(leerEntornoDispositivo()), [])
  const [aviso, setAviso] = useState<string | null>(null)
  const contenedor = useRef<HTMLElement>(null)

  const esIphoneSinInstalar =
    deteccion.plataforma === 'ios' && !deteccion.standalone

  useEffect(() => {
    contenedor.current?.focus()
  }, [])

  function continuar(): void {
    guardarDescarte(almacenDelNavegador())
    navegar('/app/hoy', { replace: true })
  }

  function yaLaInstale(): void {
    if (!deteccion.standalone) {
      setAviso('Abre KlippFlow desde el ícono de tu pantalla de inicio para continuar.')
      return
    }
    continuar()
  }

  return (
    <main
      ref={contenedor}
      tabIndex={-1}
      className="screen flex min-h-[100dvh] flex-col outline-none"
    >
      <div className="flex justify-center">
        <Logo tamano="md" decorativo />
      </div>

      <ScreenHeader
        className="mt-6"
        eyebrow="ANTES DE EMPEZAR · 1 MINUTO"
        titulo="Instala la app para no perder ninguna cita"
        descripcion={
          esIphoneSinInstalar
            ? 'En iPhone, las notificaciones solo llegan si KlippFlow está en tu pantalla de inicio.'
            : 'Activa las notificaciones para enterarte de cada solicitud sin abrir la app.'
        }
      />

      {esIphoneSinInstalar ? (
        <>
          <PasosInstalacion pasoCuatroPendiente />

          <div aria-live="polite" className="mt-4">
            {aviso && (
              <p role="alert" className="type-helper text-amber">
                {aviso}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <Button onClick={yaLaInstale} className="w-full">
              Ya la instalé, continuar
            </Button>
            <Button variante="ghost" onClick={continuar} className="w-full">
              Hacerlo después
            </Button>
          </div>
        </>
      ) : (
        <PasoNotificaciones onContinuar={continuar} />
      )}
    </main>
  )
}
