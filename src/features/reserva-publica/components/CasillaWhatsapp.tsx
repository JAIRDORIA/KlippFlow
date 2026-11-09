import { useId } from 'react'
import { formatearCelularVisible } from '../domain/celular'

export interface CasillaWhatsappProps {
  /** Celular del perfil autenticado; si no normaliza, la casilla no se muestra. */
  celular: string
  acepta: boolean
  onCambio: (acepta: boolean) => void
}

/**
 * Consentimiento explícito de recordatorios por WhatsApp (Paso A del backend).
 *
 * Desmarcada por defecto: el cliente debe marcarla. No se persiste en
 * `localStorage`; solo viaja en el POST de creación de la cita.
 */
export function CasillaWhatsapp({
  celular,
  acepta,
  onCambio,
}: CasillaWhatsappProps) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const celularVisible = formatearCelularVisible(celular)

  if (!celularVisible) return null

  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col gap-2">
      <h2 id={`${id}-titulo`} className="type-eyebrow">
        4 · WHATSAPP
      </h2>

      <label
        htmlFor={id}
        className="type-small flex min-h-[var(--height-button-compact)] cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-line bg-card px-4 py-3 text-secondary"
      >
        <input
          id={id}
          type="checkbox"
          name="aceptaWhatsapp"
          checked={acepta}
          onChange={(evento) => onCambio(evento.target.checked)}
          aria-describedby={idAyuda}
          className="mt-0.5 size-5 shrink-0 accent-accent"
        />
        <span>
          Quiero recibir recordatorios de mi cita por WhatsApp. Puedo darme de
          baja cuando quiera respondiendo BAJA.
        </span>
      </label>

      <p id={idAyuda} className="type-helper">
        Te escribiremos al celular de tu perfil:{' '}
        <span className="font-mono text-text">{celularVisible}</span>.
      </p>
    </section>
  )
}
