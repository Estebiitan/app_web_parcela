import { useMemo, useState } from 'react'

import { Badge, Card, CardContent } from '@/design-system'
import {
  propertyExperienceHighlights,
  propertyGalleryImages,
  propertyMosaicImageIds,
  type PropertyGalleryImage,
} from '@/modules/public-site/content/propertyMedia'
import { cn } from '@/shared/lib/cn'

function GalleryImage({
  image,
  className,
  loading = 'lazy',
}: {
  image: PropertyGalleryImage
  className?: string
  loading?: 'eager' | 'lazy'
}) {
  return (
    <img
      alt={image.alt}
      className={cn('h-full w-full object-cover', className)}
      loading={loading}
      src={image.src}
    />
  )
}

export function PropertyVisualGallery() {
  const [selectedImageId, setSelectedImageId] = useState(propertyGalleryImages[0].id)

  const selectedIndex = Math.max(
    propertyGalleryImages.findIndex((image) => image.id === selectedImageId),
    0,
  )
  const selectedImage = propertyGalleryImages[selectedIndex]
  const highlightImages = propertyGalleryImages.filter((image) => image.id !== selectedImage.id)
  const mosaicImages = useMemo(
    () =>
      propertyMosaicImageIds
        .map((id) => propertyGalleryImages.find((image) => image.id === id))
        .filter((image): image is PropertyGalleryImage => Boolean(image)),
    [],
  )

  function showImageAt(index: number) {
    const nextIndex = (index + propertyGalleryImages.length) % propertyGalleryImages.length
    setSelectedImageId(propertyGalleryImages[nextIndex].id)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="group relative min-h-[25rem] overflow-hidden border-border-soft/80 p-0 shadow-panel sm:min-h-[28rem] lg:min-h-[31rem]">
          <GalleryImage
            className="gallery-reveal"
            image={selectedImage}
            key={selectedImage.id}
            loading="eager"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,18,15,0.88),rgba(5,18,15,0.52)_42%,rgba(5,18,15,0.18)),linear-gradient(180deg,rgba(5,18,15,0.06),rgba(5,18,15,0.62))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(132,188,105,0.22),transparent_28%)] opacity-80" />

          <CardContent className="absolute inset-0 justify-between p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-white/15 bg-white/12 text-white" tone="neutral">
                  Galeria real
                </Badge>
                <Badge className="border-white/15 bg-white/12 text-white" tone="neutral">
                  {selectedImage.area}
                </Badge>
              </div>
              <p className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 backdrop-blur-md">
                {selectedIndex + 1} / {propertyGalleryImages.length}
              </p>
            </div>

            <div className="max-w-[39rem] rounded-[2rem] border border-white/12 bg-[rgb(var(--primitive-color-forest-900)/0.62)] p-5 shadow-[0_2rem_5rem_rgba(0,0,0,0.34)] backdrop-blur-md sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/68">
                {selectedImage.label}
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.15rem,1.55rem+2.35vw,4.45rem)] leading-[0.94] text-white drop-shadow-[0_1rem_2rem_rgba(0,0,0,0.38)]">
                Naturaleza, piscina y espacios listos para compartir.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/88 sm:text-base">
                {selectedImage.caption}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-white/18 bg-white/12 px-5 py-3 text-sm font-semibold text-white shadow-soft backdrop-blur-md transition-[background-color,border-color,transform] duration-swift ease-emphasized hover:-translate-y-0.5 hover:border-white/32 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/24"
                  onClick={() => showImageAt(selectedIndex - 1)}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className="rounded-full border border-white/18 bg-white px-5 py-3 text-sm font-semibold text-[rgb(var(--primitive-color-forest-900))] shadow-soft transition-[background-color,border-color,transform] duration-swift ease-emphasized hover:-translate-y-0.5 hover:bg-white/88 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/28"
                  onClick={() => showImageAt(selectedIndex + 1)}
                  type="button"
                >
                  Siguiente foto
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {propertyExperienceHighlights.map((item) => (
                <div
                  className="rounded-2xl border border-white/12 bg-[rgb(var(--primitive-color-forest-900)/0.52)] px-4 py-3 text-white shadow-soft backdrop-blur-md transition-transform duration-gentle ease-emphasized group-hover:-translate-y-0.5"
                  key={item.title}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/58">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/88">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="overflow-hidden p-0">
            <CardContent className="gap-0 p-0">
              <div className="grid grid-cols-2 gap-2 p-2">
                {highlightImages.slice(0, 4).map((image) => (
                  <button
                    aria-label={`Ver imagen de ${image.label}`}
                    className="group relative min-h-32 overflow-hidden rounded-[1.35rem] border border-border-soft bg-panel-muted text-left shadow-soft outline-none transition-[border-color,box-shadow,transform] duration-gentle ease-emphasized hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)] sm:min-h-36"
                    key={image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    type="button"
                  >
                    <GalleryImage image={image} />
                    <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,15,0.05),rgba(4,18,15,0.88))]" />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/64">
                        {image.area}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-white">
                        {image.label}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-accent/20 bg-[linear-gradient(135deg,rgb(var(--color-panel)),rgb(var(--color-accent-soft)/0.8))]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-accent/18 blur-3xl" />
            <CardContent className="gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="success">Experiencia completa</Badge>
                <Badge tone="neutral">{propertyGalleryImages.length} fotos reales</Badge>
              </div>
              <div className="space-y-3">
                <h3 className="font-display text-[clamp(1.7rem,1.35rem+1vw,2.65rem)] leading-tight text-text-primary">
                  Un recorrido visual antes de reservar.
                </h3>
                <p className="text-sm leading-8 text-text-secondary">
                  La galeria muestra los espacios principales que el cliente necesita entender
                  antes de consultar disponibilidad: piscina, terraza, quincho, jardines, cancha y
                  zonas de llegada.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border-soft bg-panel/72 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Ideal para
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-primary">
                    Cumpleanos, reuniones familiares, descanso y celebraciones de dia.
                  </p>
                </div>
                <div className="rounded-2xl border border-border-soft bg-panel/72 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Recorrido
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-primary">
                    Usa las miniaturas o los botones para cambiar la escena principal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="gap-0 p-0">
          <div className="flex items-center justify-between gap-4 border-b border-border-soft px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                Recorrido completo
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Todas las fotos disponibles quedan listas para navegar desde el inicio.
              </p>
            </div>
            <Badge tone="neutral">{propertyGalleryImages.length} imagenes</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto p-3 [scrollbar-width:thin]">
            {propertyGalleryImages.map((image, index) => {
              const isSelected = image.id === selectedImage.id

              return (
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  aria-label={`Seleccionar ${image.label}`}
                  className={cn(
                    'group relative h-24 min-w-40 overflow-hidden rounded-2xl border bg-panel-muted text-left shadow-soft outline-none transition-[border-color,box-shadow,transform] duration-swift ease-emphasized hover:-translate-y-0.5 hover:border-accent/45 focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]',
                    isSelected ? 'border-accent shadow-lift' : 'border-border-soft',
                  )}
                  key={image.id}
                  onClick={() => setSelectedImageId(image.id)}
                  type="button"
                >
                  <GalleryImage image={image} />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,15,0.02),rgba(4,18,15,0.74))]" />
                  <span className="absolute inset-x-0 bottom-0 p-3">
                    <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/62">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-white">{image.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-6">
        {mosaicImages.map((image, index) => (
          <button
            aria-label={`Destacar ${image.label}`}
            className={cn(
              'group relative min-h-44 overflow-hidden rounded-[1.65rem] border border-border-soft bg-panel-muted text-left shadow-soft outline-none transition-[border-color,box-shadow,transform] duration-gentle ease-emphasized hover:-translate-y-1 hover:border-accent/45 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)] sm:min-h-48',
              index === 0 || index === 1 ? 'md:col-span-3' : 'md:col-span-2',
            )}
            key={image.id}
            onClick={() => setSelectedImageId(image.id)}
            type="button"
          >
            <GalleryImage image={image} />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,18,15,0.04),rgba(4,18,15,0.88))]" />
            <span className="absolute inset-x-0 bottom-0 p-5">
              <span className="rounded-full border border-white/14 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
                {image.area}
              </span>
              <span className="mt-3 block font-display text-xl leading-tight text-white">
                {image.label}
              </span>
              <span className="mt-2 block max-w-sm rounded-2xl bg-[rgb(var(--primitive-color-forest-900)/0.48)] px-3 py-2 text-sm leading-6 text-white/86 backdrop-blur-sm">
                {image.caption}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
