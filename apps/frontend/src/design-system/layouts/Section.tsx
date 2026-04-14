import type { HTMLAttributes, ReactNode } from 'react'

import { Container } from '@/design-system/layouts/Container'
import { cn } from '@/shared/lib/cn'

type SectionProps = HTMLAttributes<HTMLElement> & {
  title?: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  width?: 'content' | 'wide' | 'full'
}

export function Section({
  className,
  title,
  description,
  eyebrow,
  actions,
  children,
  width = 'content',
  ...props
}: SectionProps) {
  return (
    <section className={cn('py-10 sm:py-12', className)} {...props}>
      <Container width={width}>
        {(title || description || eyebrow || actions) && (
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-tertiary">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2 className="font-display text-[clamp(1.9rem,1.5rem+1vw,2.75rem)] leading-tight text-text-primary">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="max-w-2xl text-base leading-8 text-text-secondary">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
