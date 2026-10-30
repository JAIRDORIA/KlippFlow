import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/shared/ui'
import { Badge } from '@/shared/ui/Badge'
import { BottomNav } from '@/shared/ui/BottomNav'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { LogoKlippFlow } from '@/shared/ui/LogoKlippFlow'
import { Money } from '@/shared/ui/Money'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Segmented } from '@/shared/ui/Segmented'
import { Select } from '@/shared/ui/Select'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Spinner } from '@/shared/ui/Spinner'
import { Switch } from '@/shared/ui/Switch'

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="type-eyebrow">{titulo}</h2>
      {children}
    </section>
  )
}

export default function DevPage() {
  const { mostrarToast } = useToast()
  const [abierto, setAbierto] = useState(false)
  const [segmento, setSegmento] = useState<'no' | 'si'>('no')
  const [activo, setActivo] = useState(true)
  const [opcion, setOpcion] = useState('30')

  function cerrarSheet() {
    setAbierto(false)
  }

  return (
    <main className="screen flex flex-col gap-10">
      <div className="flex items-start justify-between gap-4">
        <ScreenHeader
          eyebrow="SOLO DESARROLLO"
          titulo="Kit de componentes"
          descripcion="Revisión visual de todos los estados. Esta ruta no existe en producción."
        />
        <Link
          to="/"
          className="type-small shrink-0 rounded-[var(--radius-button-card)] border border-line px-3 py-2 text-secondary hover:bg-white-5 hover:text-text"
        >
          Inicio
        </Link>
      </div>

      <Seccion titulo="MARCA">
        <div className="flex items-center gap-6">
          <LogoKlippFlow tamano={96} />
          <div>
            <p className="type-brand">KlippFlow</p>
            <p className="type-helper mt-2">Logo provisional, reemplazable.</p>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="BOTONES">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Entrar</Button>
          <Button variante="ghost">Volver</Button>
          <Button variante="danger">Eliminar compra</Button>
          <Button tamano="compacto">Atendido</Button>
          <Button tamano="compacto" variante="ghost">
            No asistió
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button cargando>Guardando</Button>
          <Button disabled>Desactivado</Button>
          <Button variante="danger" disabled>
            Desactivado danger
          </Button>
        </div>
      </Seccion>

      <Seccion titulo="TARJETAS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="type-card-title">Tarjeta estándar</p>
            <p className="type-small mt-2 text-secondary">Radio 16 y padding 20.</p>
          </Card>
          <Card variante="agenda">
            <p className="type-card-title">Tarjeta de agenda</p>
            <p className="type-small mt-2 text-secondary">Padding 16.</p>
          </Card>
          <Card variante="financiera" seleccionada>
            <p className="type-eyebrow">SELECCIONADA</p>
            <Money monto={150_000} tamano="resumen" className="mt-3 block" />
          </Card>
          <div className="rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)]">
            <p className="type-small text-amber">Bloque de advertencia / aviso.</p>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="CAMPOS">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            etiqueta="Usuario"
            ayuda="Así entra el barbero."
            placeholder="barbero1"
          />
          <Input
            etiqueta="Contraseña"
            type="password"
            error="Este campo es obligatorio."
            placeholder="••••••••"
          />
          <Select
            etiqueta="Duración"
            value={opcion}
            onChange={(evento) => setOpcion(evento.target.value)}
            opciones={[
              { valor: '15', etiqueta: '15 minutos' },
              { valor: '30', etiqueta: '30 minutos' },
              { valor: '45', etiqueta: '45 minutos' },
            ]}
          />
          <Field
            etiqueta="Campo base"
            htmlFor="dev-campo-base"
            ayuda="Field permite componer controles propios."
          >
            <input
              id="dev-campo-base"
              className="type-form h-[var(--height-input)] rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] text-text"
              placeholder="Control propio"
            />
          </Field>
        </div>
      </Seccion>

      <Seccion titulo="SEGMENTADO Y SWITCH">
        <Segmented
          etiqueta="¿Dejó propina?"
          valor={segmento}
          onCambio={setSegmento}
          opciones={[
            { valor: 'no', etiqueta: 'No' },
            { valor: 'si', etiqueta: 'Sí' },
          ]}
        />
        <div className="flex items-center gap-4">
          <Switch activo={activo} onCambio={setActivo} etiqueta="Activar notificaciones" />
          <span className="type-small text-secondary">
            {activo ? 'Activado' : 'Desactivado'}
          </span>
          <Switch activo={false} onCambio={() => undefined} etiqueta="Desactivado" disabled />
        </div>
      </Seccion>

      <Seccion titulo="CHIPS Y BADGES">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Neutro</Chip>
          <Chip variante="hueso">Hueso</Chip>
          <Chip variante="verde">Libre · 09:00–09:30</Chip>
          <Chip variante="ambar">Por confirmar</Chip>
          <Chip variante="rojo">Ocupado</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge cantidad={3} />
          <Badge cantidad={120} />
          <span className="type-helper">Badge se oculta con cantidad 0.</span>
        </div>
      </Seccion>

      <Seccion titulo="MONTOS">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="type-eyebrow">GANANCIA NETA</p>
            <Money monto={-42_000} tamano="principal" colorPorSigno className="mt-2 block" />
          </Card>
          <Card>
            <p className="type-eyebrow">TOTAL DE COBRO</p>
            <Money monto={36_000} tamano="total" className="mt-2 block" />
          </Card>
          <Card>
            <p className="type-eyebrow">RESUMEN</p>
            <Money monto={28_000} tamano="resumen" className="mt-2 block" />
          </Card>
          <Card>
            <p className="type-eyebrow">DETALLE</p>
            <p className="type-small mt-2">
              Servicios <Money monto={45_000} /> · Compra{' '}
              <Money monto={-27_000} lista colorPorSigno /> · Cero{' '}
              <Money monto={0} colorPorSigno />
            </p>
          </Card>
        </div>
      </Seccion>

      <Seccion titulo="ESTADOS">
        <div className="grid gap-4 sm:grid-cols-2">
          <EmptyState
            titulo="No tienes citas para hoy"
            descripcion="Los horarios libres aparecerán aquí."
          />
          <Card className="flex flex-col gap-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-36" pildora />
          </Card>
        </div>
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="type-helper">Spinner de carga</span>
        </div>
      </Seccion>

      <Seccion titulo="SHEET Y TOAST">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setAbierto(true)}>Abrir sheet</Button>
          <Button
            variante="ghost"
            onClick={() =>
              mostrarToast({ mensaje: 'Cambios guardados.' })
            }
          >
            Toast simple
          </Button>
          <Button
            variante="ghost"
            onClick={() =>
              mostrarToast({
                mensaje: 'El barbero aceptó la solicitud.',
                accion: {
                  etiqueta: 'Avisar',
                  onClick: () => undefined,
                },
              })
            }
          >
            Toast con acción
          </Button>
        </div>
        <Sheet
          abierto={abierto}
          onCerrar={cerrarSheet}
          titulo="Cliente atendido"
          descripcion="Prueba Esc, toque fuera, foco atrapado y scroll bloqueado."
          pie={
            <div className="flex flex-col gap-3">
              <Button onClick={cerrarSheet}>Confirmar cobro</Button>
              <Button variante="ghost" onClick={cerrarSheet}>
                Volver
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <Input etiqueta="Nombre" placeholder="Cliente" />
            <Input etiqueta="Propina" inputMode="numeric" placeholder="$5.000" />
          </div>
        </Sheet>
      </Seccion>

      <Seccion titulo="NAVEGACIÓN INFERIOR">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
          <BottomNav solicitudesPendientes={3} fija={false} />
        </div>
      </Seccion>
    </main>
  )
}
