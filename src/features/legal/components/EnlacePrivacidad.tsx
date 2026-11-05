import { cn } from '@/shared/lib/cn'

export interface EnlacePrivacidadProps {
  className?: string
}

/** Enlace discreto y consistente a la política pública. */
export function EnlacePrivacidad({ className }: EnlacePrivacidadProps) {
  return (
    <a
      href="/privacidad"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'type-helper inline-flex min-h-[var(--height-button-compact)] items-center text-secondary underline underline-offset-2 hover:text-text',
        className,
      )}
    >
      Política de privacidad
    </a>
  )
}
