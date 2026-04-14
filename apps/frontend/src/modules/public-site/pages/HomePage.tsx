import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Section,
} from '@/design-system'
import { PropertyQuickFacts } from '@/modules/public-site/components/PropertyQuickFacts'
import { PropertyVisualGallery } from '@/modules/public-site/components/PropertyVisualGallery'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { formatCurrency } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { KeyValueList } from '@/shared/ui/KeyValueList'
import { LinkButton } from '@/shared/ui/LinkButton'
import { LoadingPanel } from '@/shared/ui/LoadingPanel'

const guestFlowSteps = [
  {
    title: '1. Revisar disponibilidad',
    description:
      'Consulta un rango de fechas y recibe respuesta inmediata con conflictos y cotizacion base cuando corresponda.',
  },
  {
    title: '2. Enviar solicitud sin cuenta',
    description:
      'Completa tus datos, selecciona fechas y recibe un identificador con token de seguimiento.',
  },
  {
    title: '3. Seguir el proceso',
    description:
      'Puedes revisar el estado de la reserva y adjuntar comprobantes usando tu identificador y token.',
  },
]

const valueBlocks = [
  {
    title: 'Consulta antes de comprometerte',
    description:
      'Revisa disponibilidad real, entiende el rango de precio base y confirma si la parcela encaja con tu fecha ideal.',
  },
  {
    title: 'Solicita sin crear cuenta',
    description:
      'La primera interaccion es invitada: dejas tus datos, recibes un identificador y sigues todo el proceso con token seguro.',
  },
  {
    title: 'Opera con claridad',
    description:
      'Puedes volver a revisar el estado, entender en que etapa va tu solicitud y subir tu comprobante cuando corresponda.',
  },
]

export function HomePage() {
  const { data: property, error, isLoading, reload } = usePropertyInfo()

  return (
    <div className="pb-16">
      <PageHeader
        actions={
          <>
            <LinkButton to="/disponibilidad">Consultar disponibilidad</LinkButton>
            <LinkButton to="/reservar" variant="secondary">
              Solicitar reserva
            </LinkButton>
          </>
        }
        description={
          property?.short_description ||
          'Descubre la parcela, revisa disponibilidad real y envia tu solicitud sin crear cuenta.'
        }
        eyebrow="Reserva invitada"
        metadata={property ? <Badge tone="success">API conectada</Badge> : null}
        title={property?.name || 'Todo el flujo publico de reserva en una sola experiencia'}
      />

      <Section
        description="Inicio concentra la presentacion completa del producto publico: contexto, ficha operativa, disponibilidad, contacto y proximos pasos."
        title="Experiencia publica de la parcela"
      >
        <PropertyVisualGallery />
      </Section>

      <Section
        description="La home ahora cumple el rol principal de descubrimiento para que el cliente no tenga que navegar por una pagina adicional antes de decidir."
        title="Todo lo importante para evaluar tu reserva"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {valueBlocks.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        description="Esta informacion proviene del perfil publico activo de la parcela y ayuda a dar contexto antes de consultar disponibilidad o enviar la solicitud."
        title="Informacion clave antes de reservar"
      >
        {isLoading ? <LoadingPanel label="Cargando informacion de la parcela..." /> : null}
        {!isLoading && error ? (
          <FeedbackPanel
            actionLabel="Reintentar"
            description={error}
            onAction={reload}
            title="No fue posible cargar la informacion publica"
          />
        ) : null}
        {!isLoading && property ? <PropertyQuickFacts property={property} /> : null}
      </Section>

      {property ? (
        <Section
          description="Esta ficha resume lo operativo y lo comercial en un solo lugar para que no tengas que saltar entre pantallas antes de tomar una decision."
          title="Ficha publica completa"
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>Descripcion, ubicacion y tarifa base</CardTitle>
                <CardDescription>
                  Informacion tomada del registro publico activo de la parcela.
                </CardDescription>
              </CardHeader>
              <CardContent className="gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Resumen de la experiencia
                  </p>
                  <p className="text-sm leading-8 text-text-secondary">
                    {property.short_description ||
                      'La parcela aun no tiene una descripcion publica detallada.'}
                  </p>
                </div>
                <KeyValueList
                  items={[
                    {
                      label: 'Ubicacion referencial',
                      value: property.location_name || 'No configurada',
                    },
                    {
                      label: 'Direccion',
                      value: property.address || 'No configurada',
                    },
                    {
                      label: 'Tarifa base diaria',
                      value: formatCurrency(property.base_daily_price, property.currency),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicios, contacto y siguientes pasos</CardTitle>
                <CardDescription>
                  Todo lo necesario para pasar de exploracion a accion sin friccion.
                </CardDescription>
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
                    <Badge tone="warning">Amenities aun no configurados</Badge>
                  )}
                </div>

                <KeyValueList
                  items={[
                    {
                      label: 'Correo de contacto',
                      value: property.contact_email || 'No configurado',
                    },
                    {
                      label: 'Telefono de contacto',
                      value: property.contact_phone || 'No configurado',
                    },
                  ]}
                />

                <div className="flex flex-wrap gap-3">
                  <LinkButton to="/disponibilidad">Ver disponibilidad</LinkButton>
                  <LinkButton to="/reservar" variant="secondary">
                    Solicitar reserva
                  </LinkButton>
                  <LinkButton to="/seguimiento" variant="ghost">
                    Consultar reserva
                  </LinkButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      ) : null}

      <Section
        description="El recorrido ya esta definido sobre la API actual del producto y no depende de login para la primera interaccion."
        title="Que puede hacer un usuario invitado hoy"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {guestFlowSteps.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Section>

      {property ? (
        <Section
          actions={
            <>
              <LinkButton to="/disponibilidad" variant="secondary">
                Explorar fechas
              </LinkButton>
              <LinkButton to="/seguimiento" variant="ghost">
                Consultar mi reserva
              </LinkButton>
            </>
          }
          description="La V1 del producto privilegia claridad operacional: evitar sobre-reservas, ordenar comprobantes y hacer visible el estado de cada solicitud."
          title={`Desde ${formatCurrency(property.base_daily_price, property.currency)} por dia base`}
        >
          <Card>
            <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Ubicacion
                </p>
                <p className="text-lg leading-8 text-text-primary">
                  {property.location_name || property.address || 'Ubicacion por confirmar'}
                </p>
                <p className="max-w-2xl text-sm leading-7 text-text-secondary">
                  {property.short_description || 'Sin descripcion publica configurada todavia.'}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border-soft bg-panel-muted p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Contacto publico
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-text-primary">
                  <p>{property.contact_email || 'Correo no configurado'}</p>
                  <p>{property.contact_phone || 'Telefono no configurado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      ) : null}
    </div>
  )
}
