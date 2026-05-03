import { PageHeader, Section } from '@/design-system'
import { PropertyLocationMap } from '@/modules/public-site/components/PropertyLocationMap'
import { PropertyQuickFacts } from '@/modules/public-site/components/PropertyQuickFacts'
import { PropertyVisualGallery } from '@/modules/public-site/components/PropertyVisualGallery'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { LoadingPanel } from '@/shared/ui/LoadingPanel'

export function PropertyDetailsPage() {
  const { data: property, error, isLoading, reload } = usePropertyInfo()

  return (
    <div className="pb-16">
      <PageHeader
        description="Esta vista reune el detalle publico disponible desde la API actual para que el cliente evalue antes de consultar fechas o enviar su solicitud."
        eyebrow="Informacion publica"
        title={property?.name || 'Detalle de la parcela'}
      />

      <Section
        description="La galeria y la informacion visible se alimentan desde la configuracion activa del panel administrativo."
        title="Vista general"
      >
        <PropertyVisualGallery
          galleryImages={property?.gallery_images}
          heroImageIds={property?.hero_gallery_image_ids}
          propertyDescription={property?.short_description}
          propertyName={property?.name}
        />
      </Section>

      <Section
        description="Puntos de referencia, entorno cercano y rutas desde la direccion del visitante."
        title="Mapa del recinto"
        width="wide"
      >
        {isLoading ? <LoadingPanel label="Cargando ficha publica..." /> : null}
        {!isLoading && error ? (
          <FeedbackPanel
            actionLabel="Reintentar"
            description={error}
            onAction={reload}
            title="No fue posible cargar la ficha publica"
          />
        ) : null}
        {!isLoading && property ? (
          <div className="grid gap-6">
            <PropertyQuickFacts property={property} />
            <PropertyLocationMap
              config={property.location_map}
              fallbackAddress={property.address}
              fallbackLocationName={property.location_name}
              fallbackName={property.name}
            />
          </div>
        ) : null}
      </Section>
    </div>
  )
}
