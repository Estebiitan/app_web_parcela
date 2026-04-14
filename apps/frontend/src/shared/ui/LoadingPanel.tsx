import { Card, CardContent } from '@/design-system'

type LoadingPanelProps = {
  label?: string
}

export function LoadingPanel({ label = 'Cargando información...' }: LoadingPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="gap-4 py-2">
        <div className="h-4 w-28 animate-pulse rounded-full bg-panel-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-panel-muted" />
        <div className="grid gap-3">
          <div className="h-4 w-full animate-pulse rounded-full bg-panel-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-panel-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-panel-muted" />
        </div>
        <span className="text-sm text-text-tertiary">{label}</span>
      </CardContent>
    </Card>
  )
}
