import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Section } from '@/design-system'
import { PropertyQuickFacts } from '@/modules/public-site/components/PropertyQuickFacts'
import { PropertyVisualGallery } from '@/modules/public-site/components/PropertyVisualGallery'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { formatCurrency } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { KeyValueList } from '@/shared/ui/KeyValueList'
import { LoadingPanel } from '@/shared/ui/LoadingPanel'

export function PropertyDetailsPage() {
  const { data: property, error, isLoading, reload } = usePropertyInfo()

  return (
    <div className="pb-16">
      <PageHeader
        description="Esta vista reúne el detalle público disponible desde la API actual para que el cliente evalúe antes de consultar fechas o enviar su solicitud."
        eyebrow="Información pública"
        title={property?.name || 'Detalle de la parcela'}
      />

      <Section
        description="La capa pública todavía no expone galería de medios desde backend, así que la experiencia visual usa composición editorial del sistema de diseño mientras el contenido operativo sale de la API real."
        title="Vista general"
      >
        <PropertyVisualGallery />
      </Section>

      <Section
        description="Todos estos datos provienen del registro activo de la parcela configurado en administración."
        title="Ficha operativa"
      >
        {isLoading ? <LoadingPanel label="Cargando ficha pública..." /> : null}
        {!isLoading && error ? (
          <FeedbackPanel
            actionLabel="Reintentar"
            description={error}
            onAction={reload}
            title="No fue posible cargar la ficha pública"
          />
        ) : null}
        {!isLoading && property ? (
          <div className="grid gap-6">
            <PropertyQuickFacts property={property} />
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Descripción y ubicación</CardTitle>
                </CardHeader>
                <CardContent className="gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                      Resumen
                    </p>
                    <p className="text-sm leading-8 text-text-secondary">
                      {property.short_description || 'La parcela aún no tiene una descripción pública detallada.'}
                    </p>
                  </div>
                  <KeyValueList
                    items={[
                      {
                        label: 'Ubicación referencial',
                        value: property.location_name || 'No configurada',
                      },
                      {
                        label: 'Dirección',
                        value: property.address || 'No configurada',
                      },
                      {
                        label: 'Tarifa base',
                        value: formatCurrency(property.base_daily_price, property.currency),
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Servicios y contacto</CardTitle>
                </CardHeader>
                <CardContent className="gap-6">
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.length > 0 ? (
                      property.amenities.map((amenity) => (
                        <Badge key={amenity} tone="neutral">
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="warning">Amenities aún no configurados</Badge>
                    )}
                  </div>
                  <KeyValueList
                    items={[
                      {
                        label: 'Correo de contacto',
                        value: property.contact_email || 'No configurado',
                      },
                      {
                        label: 'Teléfono de contacto',
                        value: property.contact_phone || 'No configurado',
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  )
}
