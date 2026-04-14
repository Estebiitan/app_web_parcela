import type { HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: 'content' | 'wide' | 'full'
}

const widthClassNames = {
  content: 'max-w-[var(--layout-container-max)]',
  wide: 'max-w-[min(92rem,100%)]',
  full: 'max-w-none',
} as const

export function Container({
  className,
  width = 'content',
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-gutter', widthClassNames[width], className)}
      {...props}
    />
  )
}
