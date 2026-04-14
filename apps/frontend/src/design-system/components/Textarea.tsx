import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, hint, error, id, rows = 5, ...props }, ref) {
    const describedBy = error || hint ? `${id}-description` : undefined

    return (
      <label className="flex w-full flex-col gap-3">
        {label ? (
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        ) : null}
        <span className="relative block">
          <textarea
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className={cn(
              'min-h-32 w-full rounded-[var(--component-input-radius)] border border-border-soft bg-panel px-[var(--component-input-padding-inline)] py-4 text-sm text-text-primary shadow-soft outline-none transition-[border-color,box-shadow,background-color] duration-swift ease-standard placeholder:text-text-tertiary focus:border-accent focus:shadow-[0_0_0_var(--focus-ring-size)_rgb(var(--color-focus-ring)/0.28)]',
              error &&
                'border-danger/70 bg-danger-soft/30 focus:border-danger focus:shadow-[0_0_0_var(--focus-ring-size)_rgb(var(--color-danger)/0.22)]',
              className,
            )}
            id={id}
            rows={rows}
            {...props}
          />
        </span>
        {hint || error ? (
          <span
            className={cn('text-sm text-text-tertiary', error && 'text-danger')}
            id={describedBy}
          >
            {error || hint}
          </span>
        ) : null}
      </label>
    )
  },
)
