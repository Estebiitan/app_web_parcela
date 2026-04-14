import type { ComponentPropsWithoutRef, ElementType } from 'react'

import { cn } from '@/shared/lib/cn'

type SurfaceTone = 'default' | 'muted' | 'elevated' | 'inverse'

type SurfaceProps<T extends ElementType> = {
  as?: T
  tone?: SurfaceTone
} & Omit<ComponentPropsWithoutRef<T>, 'as'>

const toneClasses: Record<SurfaceTone, string> = {
  default: 'border-border-soft bg-panel text-text-primary shadow-soft',
  muted: 'border-border-soft bg-panel-muted text-text-primary shadow-soft',
  elevated:
    'border-border-soft bg-panel-elevated text-text-primary shadow-panel',
  inverse:
    'border-border-inverse/70 bg-panel-inverse text-text-inverse shadow-panel',
}

export function Surface<T extends ElementType = 'div'>({
  as,
  className,
  tone = 'default',
  ...props
}: SurfaceProps<T>) {
  const Component = as || 'div'

  return (
    <Component
      className={cn('rounded-xl border motion-surface', toneClasses[tone], className)}
      {...props}
    />
  )
}
