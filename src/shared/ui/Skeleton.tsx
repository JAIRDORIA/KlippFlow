import { cn } from '@/shared/lib/cn'

export interface SkeletonProps {
  className?: string
  pildora?: boolean
}

export function Skeleton({ className, pildora = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-pulse bg-white-10',
        pildora ? 'rounded-[var(--radius-pill)]' : 'rounded-[var(--radius-input)]',
        className,
      )}
    />
  )
}
