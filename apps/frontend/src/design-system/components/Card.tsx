import type { HTMLAttributes } from 'react'

import { Surface } from '@/design-system/primitives/Surface'
import { cn } from '@/shared/lib/cn'

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Surface
      className={cn(
        'flex flex-col gap-[var(--component-card-gap)] rounded-[var(--component-card-radius)] p-[var(--component-card-padding)]',
        className,
      )}
      tone="elevated"
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3', className)} {...props} />
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-[clamp(1.4rem,1.2rem+0.5vw,1.9rem)] leading-tight text-text-primary',
        className,
      )}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm leading-7 text-text-secondary', className)} {...props} />
  )
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-auto flex flex-wrap items-center gap-3 border-t border-border-soft pt-4',
        className,
      )}
      {...props}
    />
  )
}
