import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system'

type FeedbackPanelProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function FeedbackPanel({
  title,
  description,
  actionLabel,
  onAction,
}: FeedbackPanelProps) {
  return (
    <Card className="border-border-soft/90">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {actionLabel && onAction ? (
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onAction} variant="secondary">
              {actionLabel}
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}
