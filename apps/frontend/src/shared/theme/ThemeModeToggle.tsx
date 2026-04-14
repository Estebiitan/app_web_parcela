import { cn } from '@/shared/lib/cn'
import { appThemeModes } from '@/shared/theme/themeContext'
import { useTheme } from '@/shared/theme/themeContext'

type ThemeModeToggleProps = {
  className?: string
  compact?: boolean
}

const optionLabels = {
  light: 'Claro',
  dark: 'Oscuro',
} as const

const optionGlyphs = {
  light: 'L',
  dark: 'D',
} as const

export function ThemeModeToggle({
  className,
  compact = false,
}: ThemeModeToggleProps) {
  const { mode, setMode } = useTheme()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.6rem] border border-border-soft/80 bg-panel/88 p-1 shadow-panel backdrop-blur-xl',
        compact && 'rounded-full border-border-soft/70 bg-panel/72 p-[0.2rem] shadow-[0_10px_24px_rgba(12,18,18,0.12)]',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-90',
          mode === 'dark'
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(112,180,220,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(132,188,105,0.16),transparent_40%)]'
            : 'bg-[radial-gradient(circle_at_top_right,rgba(47,113,150,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(86,124,67,0.12),transparent_34%)]',
        )}
      />
      <div className="relative flex items-center gap-1">
        {appThemeModes.map((option) => {
          const isActive = mode === option

          return (
            <button
              className={cn(
                'group relative inline-flex items-center gap-2 rounded-[1.15rem] border px-3 py-2 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-swift ease-emphasized',
                compact
                  ? 'h-9 min-w-[2.35rem] justify-center rounded-full px-2 py-0 text-[0.7rem]'
                  : 'min-w-[6rem] justify-start',
                isActive
                  ? 'border-border-strong/70 bg-panel-elevated/95 text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.12)]'
                  : 'border-transparent bg-transparent text-text-tertiary hover:border-border-soft/85 hover:bg-panel-muted/72 hover:text-text-primary',
              )}
              key={option}
              onClick={() => setMode(option)}
              type="button"
            >
              <span
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full border text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-swift',
                  compact && 'h-5 w-5 border-transparent bg-transparent text-[0.62rem] tracking-[0.18em]',
                  isActive
                    ? 'border-border-strong/60 bg-panel text-text-primary'
                    : 'border-border-soft/0 bg-transparent text-text-tertiary group-hover:text-text-primary',
                )}
              >
                {optionGlyphs[option]}
              </span>
              {!compact ? <span>{optionLabels[option]}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
