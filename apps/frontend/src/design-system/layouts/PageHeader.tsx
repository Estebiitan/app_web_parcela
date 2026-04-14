import type { ReactNode } from 'react'

import { Badge } from '@/design-system/components/Badge'
import { Container } from '@/design-system/layouts/Container'
import { cn } from '@/shared/lib/cn'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  metadata?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('pt-10 sm:pt-14', className)}>
      <Container>
        <div className="relative overflow-hidden rounded-2xl border border-border-soft bg-panel/85 px-6 py-8 shadow-lift backdrop-blur sm:px-8 sm:py-10 lg:px-10">
          <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-page-grid bg-[length:32px_32px] opacity-40" />
          <div className="absolute -right-12 top-0 -z-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute left-0 top-10 -z-10 h-40 w-40 rounded-full bg-info/10 blur-3xl" />

          <div className="flex flex-col gap-[var(--component-page-header-gap)] lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[var(--component-page-header-max-width)] space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                {eyebrow ? <Badge tone="accent">{eyebrow}</Badge> : null}
                {metadata}
              </div>
              <div className="space-y-4">
                <h1 className="text-balance font-display text-[clamp(2.75rem,2rem+2vw,4.75rem)] leading-[1.02] text-text-primary">
                  {title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-text-secondary">
                  {description}
                </p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>
      </Container>
    </header>
  )
}
