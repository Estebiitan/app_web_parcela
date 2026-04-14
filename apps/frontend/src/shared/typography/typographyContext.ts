import { createContext, useContext } from 'react'

import type { TypographyMode } from '@/design-system'

export type TypographyContextValue = {
  mode: TypographyMode
  setMode: (mode: TypographyMode) => void
}

export const TypographyContext = createContext<TypographyContextValue | null>(null)

export function useTypography() {
  const context = useContext(TypographyContext)

  if (!context) {
    throw new Error('useTypography must be used within a TypographyProvider.')
  }

  return context
}
