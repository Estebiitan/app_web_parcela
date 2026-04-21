import type { PublicPropertyInfo } from '@/modules/public-site/api/publicSiteApi'
import { formatTime } from '@/shared/lib/format'
import { MetricCard } from '@/shared/ui/MetricCard'

type PropertyQuickFactsProps = {
  property: PublicPropertyInfo
}

export function PropertyQuickFacts({ property }: PropertyQuickFactsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        description="Configurado desde la API publica."
        label="Capacidad"
        value={
          property.max_guest_count
            ? `${property.max_guest_count} personas`
            : 'A coordinar'
        }
      />
      <MetricCard
        description="El detalle comercial vive en la seccion de precios."
        label="Modalidad"
        value="Arriendo por jornada"
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
