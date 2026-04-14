import type { HTMLAttributes } from 'react'

import type { BadgeTone } from '@/design-system/tokens/contract'
import { cn } from '@/shared/lib/cn'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const toneClassNames: Record<BadgeTone, string> = {
  neutral: 'border-border-soft bg-panel text-text-secondary',
  accent: 'border-accent/20 bg-accent-soft text-accent-emphasis',
  success: 'border-success/20 bg-success-soft text-success',
  warning: 'border-warning/20 bg-warning-soft text-warning',
  danger: 'border-danger/20 bg-danger-soft text-danger',
  info: 'border-info/20 bg-info-soft text-info',
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[var(--component-badge-height)] items-center rounded-pill border px-[var(--component-badge-padding-inline)] text-xs font-semibold uppercase tracking-[0.16em]',
        toneClassNames[tone],
        className,
      )}
      {...props}
    />
  )
}
