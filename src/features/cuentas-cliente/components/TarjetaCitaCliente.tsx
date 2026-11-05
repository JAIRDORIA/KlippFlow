import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { Money } from '@/shared/ui/Money'
import {
  etiquetaEstadoCita,
  fechaCitaLegible,
  horaCitaLegible,
  varianteEstadoCita,
} from '../domain/citas'
import type { CitaCliente } from '../types'

export function TarjetaCitaCliente({ cita }: { cita: CitaCliente }) {
  const barberia = cita.barbero.nombreBarberia ?? cita.barbero.nombre

  return (
    <Link
      to={`/mi/citas/${cita.id}`}
      className="kf-press block rounded-[var(--radius-card)] focus-visible:outline-none"
      aria-label={`Ver detalle de la cita en ${barberia}`}
    >
      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-card-title truncate">{barberia}</p>
            <p className="type-aux mt-1 text-secondary">
              {fechaCitaLegible(cita.fecha)} · {horaCitaLegible(cita.horaInicio)}
            </p>
          </div>
          <Chip variante={varianteEstadoCita(cita.estado)}>
            {etiquetaEstadoCita(cita.estado)}
          </Chip>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="type-helper">
            {cita.numPersonas} {cita.numPersonas === 1 ? 'persona' : 'personas'}
          </span>
          <Money monto={cita.montoTotal} tamano="destacado" />
        </div>
      </Card>
    </Link>
  )
}
