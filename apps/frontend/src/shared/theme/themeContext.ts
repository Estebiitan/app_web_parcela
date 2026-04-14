import { createContext, useContext } from 'react'

export const appThemeModes = ['light', 'dark'] as const
export type AppThemeMode = (typeof appThemeModes)[number]

export type ThemeContextValue = {
  mode: AppThemeMode
  setMode: (mode: AppThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.')
  }

  return context
}
