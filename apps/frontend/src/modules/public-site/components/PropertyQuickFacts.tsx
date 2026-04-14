import { MetricCard } from '@/shared/ui/MetricCard'
import { formatCurrency, formatTime } from '@/shared/lib/format'

import type { PublicPropertyInfo } from '@/modules/public-site/api/publicSiteApi'

type PropertyQuickFactsProps = {
  property: PublicPropertyInfo
}

export function PropertyQuickFacts({ property }: PropertyQuickFactsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        description="Configurado desde la API pública."
        label="Capacidad"
        value={
          property.max_guest_count
            ? `${property.max_guest_count} personas`
            : 'A coordinar'
        }
      />
      <MetricCard
        description="Tarifa base por día antes de precios especiales."
        label="Tarifa base"
        value={formatCurrency(property.base_daily_price, property.currency)}
      />
      <MetricCard
        description="Horario operativo actualmente cargado."
        label="Check-in"
        value={formatTime(property.check_in_time)}
      />
      <MetricCard
        description="Horario de salida estimado."
        label="Check-out"
        value={formatTime(property.check_out_time)}
      />
    </div>
  )
}
