import type { ButtonHTMLAttributes } from 'react'

import type { ButtonSize, ButtonVariant } from '@/design-system/tokens/contract'
import { cn } from '@/shared/lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClassName =
  'inline-flex items-center justify-center gap-[var(--component-button-gap)] whitespace-nowrap rounded-lg border text-center font-medium tracking-[0.01em] motion-lift transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-swift ease-emphasized focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)] disabled:pointer-events-none disabled:opacity-50'

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-accent-emphasis bg-accent text-accent-contrast shadow-soft motion-safe:hover:-translate-y-px hover:bg-accent-emphasis',
  secondary:
    'border-border-strong bg-panel text-text-primary shadow-soft motion-safe:hover:-translate-y-px hover:border-accent/45 hover:bg-accent-soft',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:border-border-soft hover:bg-panel-muted hover:text-text-primary',
  danger:
    'border-danger bg-danger text-text-inverse shadow-soft motion-safe:hover:-translate-y-px hover:bg-danger/90',
}

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-[var(--component-button-height-sm)] px-[var(--component-button-px-sm)] text-sm',
  md: 'h-[var(--component-button-height-md)] px-[var(--component-button-px-md)] text-sm',
  lg: 'h-[var(--component-button-height-lg)] px-[var(--component-button-px-lg)] text-base',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseClassName,
        variantClassNames[variant],
        sizeClassNames[size],
        className,
      )}
      type={type}
      {...props}
    />
  )
}
