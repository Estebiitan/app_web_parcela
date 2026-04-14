import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ThemeContext, type AppThemeMode } from '@/shared/theme/themeContext'

const THEME_STORAGE_KEY = 'theme-mode'

function getInitialThemeMode(): AppThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return savedTheme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>(getInitialThemeMode)

  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-theme', mode)
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
