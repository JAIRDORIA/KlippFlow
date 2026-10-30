import { LoaderCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface SpinnerProps {
  tamano?: number
  className?: string
  etiqueta?: string
}

export function Spinner({ tamano = 20, className, etiqueta = 'Cargando' }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex items-center justify-center', className)}>
      <LoaderCircle
        aria-hidden="true"
        size={tamano}
        strokeWidth={1.6}
        className="animate-spin"
      />
      <span className="sr-only">{etiqueta}</span>
    </span>
  )
}
