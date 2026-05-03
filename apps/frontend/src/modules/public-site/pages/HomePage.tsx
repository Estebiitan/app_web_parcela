import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { Section } from '@/design-system'
import { PropertyExperienceSection } from '@/modules/public-site/components/PropertyExperienceSection'
import { PropertyLocationMap } from '@/modules/public-site/components/PropertyLocationMap'
import { PropertyVisualGallery } from '@/modules/public-site/components/PropertyVisualGallery'
import { PricingSection } from '@/modules/public-site/components/PricingSection'
import { usePropertyInfo } from '@/modules/public-site/hooks/usePropertyInfo'
import { LoadingPanel } from '@/shared/ui/LoadingPanel'

export function HomePage() {
  const { data: property, isLoading } = usePropertyInfo()
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '#seccion-disponibilidad') {
      return
    }

    const availabilitySection = document.getElementById('seccion-disponibilidad')
    if (!availabilitySection) {
      return
    }

    const timerId = window.setTimeout(() => {
      availabilitySection.classList.remove('availability-spotlight')
    }, 1800)

    availabilitySection.classList.remove('availability-spotlight')
    window.requestAnimationFrame(() => {
      availabilitySection.classList.add('availability-spotlight')
      availabilitySection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => {
      window.clearTimeout(timerId)
      availabilitySection.classList.remove('availability-spotlight')
    }
  }, [location.hash])

  function scrollToPublicContact() {
    document.getElementById('mapa-recinto')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <div className="pb-16">
      <Section className="pt-10 sm:pt-12" width="wide">
        <PropertyVisualGallery
          galleryImages={property?.gallery_images}
          heroImageIds={property?.hero_gallery_image_ids}
          propertyDescription={
            property?.short_description ||
            'Descubre la parcela, revisa disponibilidad real y envia tu solicitud sin crear cuenta.'
          }
          propertyName={property?.name || 'Parcela recreativa'}
        />
      </Section>

      <Section title="Servicios y entretenimiento" width="wide">
        <PropertyExperienceSection cards={property?.experience_cards} />
      </Section>

      {property ? (
        <Section
          id="mapa-recinto"
          title="Mapa del recinto y entorno"
          width="wide"
        >
          <PropertyLocationMap
            config={property.location_map}
            fallbackAddress={property.address}
            fallbackLocationName={property.location_name}
            fallbackName={property.name}
          />
        </Section>
      ) : null}

      {isLoading ? (
        <Section>
          <LoadingPanel label="Cargando informacion de la parcela..." />
        </Section>
      ) : null}

      <PricingSection
        onScheduleVisit={scrollToPublicContact}
        pricingRules={property?.pricing_rules}
      />
    </div>
  )
}
