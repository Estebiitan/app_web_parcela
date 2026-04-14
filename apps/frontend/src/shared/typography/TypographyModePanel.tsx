import { typographyModes, type TypographyMode } from '@/design-system'
import { cn } from '@/shared/lib/cn'
import { useTypography } from '@/shared/typography/typographyContext'

type TypographyModePanelProps = {
  className?: string
}

const typographyModeMeta: Record<
  TypographyMode,
  {
    badge: string
    title: string
    eyebrow: string
    sample: string
  }
> = {
  editorial: {
    badge: 'E',
    title: 'Editorial',
    eyebrow: 'Serif display',
    sample: 'Caracter premium con jerarquia clasica.',
  },
  modern: {
    badge: 'M',
    title: 'Moderna',
    eyebrow: 'Neo-grotesk',
    sample: 'Direccion sobria y claramente producto-digital.',
  },
  humanist: {
    badge: 'H',
    title: 'Humanista',
    eyebrow: 'Friendly utility',
    sample: 'Lectura calida y operativa al mismo tiempo.',
  },
  classic: {
    badge: 'CL',
    title: 'Classic',
    eyebrow: 'Legacy serif',
    sample: 'Tono patrimonial y elegante para una presencia mas tradicional.',
  },
  grotesk: {
    badge: 'G',
    title: 'Grotesk',
    eyebrow: 'Graphic sans',
    sample: 'Seca, directa y contemporanea para interfaces mas firmes.',
  },
  condensed: {
    badge: 'CN',
    title: 'Condensed',
    eyebrow: 'Brand width',
    sample: 'Compacta y expresiva para probar una voz de marca mas fuerte.',
  },
  technical: {
    badge: 'T',
    title: 'Technical',
    eyebrow: 'System clarity',
    sample: 'Precisa, funcional y orientada a estados, datos y operacion.',
  },
  warm: {
    badge: 'W',
    title: 'Warm',
    eyebrow: 'Soft premium',
    sample: 'Cercana y cuidada, con una sensacion mas hospitalaria.',
  },
}

export function TypographyModePanel({ className }: TypographyModePanelProps) {
  const { mode, setMode } = useTypography()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border border-border-soft/80 bg-panel/92 p-2 shadow-panel backdrop-blur-xl',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(86,124,67,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(47,113,150,0.1),transparent_38%)]" />
      <div className="relative grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {typographyModes.map((option) => {
          const isActive = mode === option
          const meta = typographyModeMeta[option]

          return (
            <button
              className={cn(
                'group rounded-[1.25rem] border px-4 py-4 text-left transition-[transform,background-color,border-color,color,box-shadow] duration-swift ease-emphasized',
                isActive
                  ? 'border-accent/35 bg-accent text-accent-contrast shadow-soft'
                  : 'border-transparent bg-transparent text-text-secondary hover:border-border-soft hover:bg-panel-muted hover:text-text-primary',
              )}
              key={option}
              onClick={() => setMode(option)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p
                    className={cn(
                      'text-[0.68rem] font-semibold uppercase tracking-[0.18em]',
                      isActive ? 'text-accent-contrast/76' : 'text-text-tertiary',
                    )}
                  >
                    {meta.eyebrow}
                  </p>
                  <p
                    className={cn(
                      'text-lg',
                      option === 'editorial' && 'font-display',
                      option === 'modern' && 'font-sans',
                      option === 'humanist' && 'font-sans tracking-[0.01em]',
                      option === 'classic' && 'font-display tracking-[0.01em]',
                      option === 'grotesk' && 'font-sans uppercase tracking-[0.04em]',
                      option === 'condensed' && 'font-sans uppercase tracking-[0.02em]',
                      option === 'technical' && 'font-sans tracking-[0.03em]',
                      option === 'warm' && 'font-display',
                    )}
                  >
                    {meta.title}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.16em]',
                    isActive
                      ? 'border-white/16 bg-white/14 text-white'
                      : 'border-border-soft bg-panel text-text-tertiary group-hover:text-text-primary',
                  )}
                >
                  {meta.badge}
                </span>
              </div>
              <p
                className={cn(
                  'mt-3 text-sm leading-7',
                  isActive ? 'text-accent-contrast/88' : 'text-text-secondary',
                )}
              >
                {meta.sample}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
