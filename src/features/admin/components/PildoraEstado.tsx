import { Chip, type VarianteChip } from '@/shared/ui/Chip'
import type { EstadoCuenta } from '../types'
import {
  ETIQUETA_ESTADO,
  VARIANTE_ESTADO,
  type VarianteEstado,
} from '../domain/estado'

/** Traduce el estado a una variante del `Chip` del kit (todo con tokens). */
const VARIANTE_CHIP: Record<VarianteEstado, VarianteChip> = {
  verde: 'verde',
  ambar: 'ambar',
  rojo: 'rojo',
}

/** Píldora del estado: color semántico y siempre con el texto. */
export function PildoraEstado({ estado }: { estado: EstadoCuenta }) {
  return (
    <Chip variante={VARIANTE_CHIP[VARIANTE_ESTADO[estado]]}>
      {ETIQUETA_ESTADO[estado]}
    </Chip>
  )
}
