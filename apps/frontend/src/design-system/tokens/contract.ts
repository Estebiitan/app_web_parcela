export const themeModes = ['system', 'light', 'dark'] as const
export type ThemeMode = (typeof themeModes)[number]

export const typographyModes = [
  'editorial',
  'modern',
  'humanist',
  'classic',
  'grotesk',
  'condensed',
  'technical',
  'warm',
] as const
export type TypographyMode = (typeof typographyModes)[number]

export const primitiveTokenGroups = {
  color: ['neutral', 'forest', 'ocean', 'amber', 'rose'],
  spacing: ['space-0', 'space-1', 'space-2', 'space-3', 'space-4', 'space-5'],
  motion: ['micro', 'swift', 'smooth', 'settle'],
} as const

export const semanticTokenGroups = {
  text: ['primary', 'secondary', 'tertiary', 'inverse'],
  surface: ['canvas', 'panel', 'panel-muted', 'panel-elevated'],
  feedback: ['accent', 'success', 'warning', 'danger', 'info'],
} as const

export const componentTokenGroups = {
  button: ['height-sm', 'height-md', 'height-lg', 'gap'],
  input: ['height', 'padding-inline', 'radius'],
  card: ['padding', 'radius', 'gap'],
} as const

export const buttonVariants = ['primary', 'secondary', 'ghost', 'danger'] as const
export type ButtonVariant = (typeof buttonVariants)[number]

export const buttonSizes = ['sm', 'md', 'lg'] as const
export type ButtonSize = (typeof buttonSizes)[number]

export const badgeTones = [
  'neutral',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
] as const
export type BadgeTone = (typeof badgeTones)[number]

export function isThemeMode(value: string | null): value is ThemeMode {
  return Boolean(value && themeModes.includes(value as ThemeMode))
}

export function isTypographyMode(value: string | null): value is TypographyMode {
  return Boolean(value && typographyModes.includes(value as TypographyMode))
}
