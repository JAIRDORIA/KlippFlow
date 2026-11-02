export type TipoPaso = 'compartir' | 'agregar' | 'abrir' | 'notificaciones'

/**
 * Ilustraciones propias y muy simples de los pasos de instalación.
 * No se usan imágenes ni íconos de Apple.
 */
export function IconoPaso({ tipo }: { tipo: TipoPaso }) {
  const comun = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (tipo === 'compartir') {
    return (
      <svg {...comun}>
        <path d="M12 15V4" />
        <path d="m8 8 4-4 4 4" />
        <path d="M6 13v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" />
      </svg>
    )
  }

  if (tipo === 'agregar') {
    return (
      <svg {...comun}>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    )
  }

  if (tipo === 'abrir') {
    return (
      <svg {...comun}>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 10v9h12v-9" />
      </svg>
    )
  }

  return (
    <svg {...comun}>
      <path d="M18 16H6l1.5-2V9a4.5 4.5 0 0 1 9 0v5L18 16Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}
