import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

type LinkButtonProps = {
  children: ReactNode
  className?: string
  state?: unknown
  to: string
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variantClassNames: Record<NonNullable<LinkButtonProps['variant']>, string> = {
  primary:
    'border-accent-emphasis bg-accent text-accent-contrast shadow-soft motion-safe:hover:-translate-y-px hover:bg-accent-emphasis',
  secondary:
    'border-border-strong bg-panel text-text-primary shadow-soft motion-safe:hover:-translate-y-px hover:border-accent/45 hover:bg-accent-soft',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:border-border-soft hover:bg-panel-muted hover:text-text-primary',
}

export function LinkButton({
  children,
  className,
  state,
  to,
  variant = 'primary',
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        'inline-flex h-[var(--component-button-height-md)] items-center justify-center gap-[var(--component-button-gap)] whitespace-nowrap rounded-lg border px-[var(--component-button-px-md)] text-center text-sm font-medium tracking-[0.01em] transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-swift ease-emphasized focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]',
        variantClassNames[variant],
        className,
      )}
      state={state}
      to={to}
    >
      {children}
    </Link>
  )
}
