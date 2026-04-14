import type { ReactNode } from 'react'

import { Card, CardContent } from '@/design-system'
import { cn } from '@/shared/lib/cn'

type MetricCardProps = {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  description,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
            {label}
          </span>
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent-emphasis">
              {icon}
            </span>
          ) : null}
        </div>
        <div className="space-y-2">
          <p className="font-display text-[clamp(1.75rem,1.5rem+0.8vw,2.5rem)] leading-none text-text-primary">
            {value}
          </p>
          {description ? (
            <p className="text-sm leading-7 text-text-secondary">{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
