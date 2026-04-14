import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { isTypographyMode, type TypographyMode } from '@/design-system'
import { TypographyContext } from '@/shared/typography/typographyContext'

const TYPOGRAPHY_STORAGE_KEY = 'typography-mode'
const DEFAULT_TYPOGRAPHY_MODE: TypographyMode = 'editorial'

function getInitialTypographyMode(): TypographyMode {
  if (typeof window === 'undefined') {
    return DEFAULT_TYPOGRAPHY_MODE
  }

  const savedTypography = window.localStorage.getItem(TYPOGRAPHY_STORAGE_KEY)
  return isTypographyMode(savedTypography) ? savedTypography : DEFAULT_TYPOGRAPHY_MODE
}

export function TypographyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TypographyMode>(getInitialTypographyMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-typography', mode)
    window.localStorage.setItem(TYPOGRAPHY_STORAGE_KEY, mode)
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode],
  )

  return <TypographyContext.Provider value={value}>{children}</TypographyContext.Provider>
}
