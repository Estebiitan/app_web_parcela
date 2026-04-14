import { Badge, Card, CardContent } from '@/design-system'

export function PropertyVisualGallery() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
      <Card className="relative overflow-hidden border-border-soft/80 bg-[radial-gradient(circle_at_top_left,rgba(178,214,197,0.28),transparent_46%),linear-gradient(160deg,rgba(16,59,44,0.94),rgba(7,23,19,0.98))] text-text-inverse shadow-panel">
        <CardContent className="min-h-[22rem] justify-between gap-10">
          <div className="space-y-4">
            <Badge className="border-white/15 bg-white/10 text-white" tone="neutral">
              Parcela recreativa
            </Badge>
            <div className="max-w-xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/68">
                Experiencia
              </p>
              <h2 className="font-display text-[clamp(2rem,1.55rem+1.3vw,3.2rem)] leading-[1.02] text-white">
                Un lugar pensado para encuentros tranquilos, celebraciones y descanso.
              </h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Exterior abierto', 'Operacion trazable', 'Reserva guiada'].map((label) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur"
                key={label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/58">
                  Ambiente
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">{label}</p>
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="overflow-hidden">
          <CardContent className="gap-5">
            <div className="h-44 rounded-[1.5rem] bg-[linear-gradient(140deg,rgba(187,226,208,0.8),rgba(101,146,126,0.4))] p-5">
              <div className="flex h-full items-end">
                <div className="rounded-2xl bg-canvas/70 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Espacios
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-primary">
                    La experiencia pública ya está lista para mostrar disponibilidad, seguimiento y pagos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-accent-soft px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                  Flujo
                </p>
                <p className="mt-2 text-sm leading-7 text-text-primary">
                  Consulta, reserva, seguimiento y comprobante en una sola experiencia.
                </p>
              </div>
              <div className="rounded-2xl bg-info-soft px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">
                  V1
                </p>
                <p className="mt-2 text-sm leading-7 text-text-primary">
                  Preparado para luego sumar login cliente y panel administrativo sin reescribir esta base.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
