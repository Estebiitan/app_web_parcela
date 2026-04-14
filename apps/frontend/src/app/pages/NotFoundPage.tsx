import { PageHeader, Section } from '@/design-system'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'

export function NotFoundPage() {
  return (
    <div className="pb-16">
      <PageHeader
        description="La ruta que intentaste abrir no pertenece a la experiencia pública actual."
        eyebrow="404"
        title="No encontramos esta página"
      />
      <Section title="Volvamos a una vista conocida">
        <FeedbackPanel
          actionLabel="Ir al inicio"
          description="Puedes regresar al home público y continuar desde disponibilidad, reserva o seguimiento."
          onAction={() => {
            window.location.assign('/')
          }}
          title="Ruta no disponible"
        />
      </Section>
    </div>
  )
}
