import { useEffect, useMemo, useState } from 'react'

import { Badge, Card, CardContent } from '@/design-system'
import {
  propertyGalleryImages as defaultGalleryImages,
  propertyHeroImageIds as defaultHeroImageIds,
  type PropertyGalleryImage,
} from '@/modules/public-site/content/propertyMedia'
import { cn } from '@/shared/lib/cn'
import { LinkButton } from '@/shared/ui/LinkButton'

const HERO_AUTOPLAY_INTERVAL_MS = 5200

type PropertyVisualGalleryProps = {
  galleryImages?: PropertyGalleryImage[]
  heroImageIds?: readonly string[]
  propertyDescription?: string
  propertyName?: string
}

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
      style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined}
    />
  )
}

function resolveAspectClass(image: PropertyGalleryImage) {
  if (image.orientation === 'square') {
    return 'aspect-square'
  }

  return 'aspect-[4/3] lg:aspect-[16/11]'
}

export function PropertyVisualGallery({
  galleryImages = defaultGalleryImages,
  heroImageIds = defaultHeroImageIds,
  propertyDescription,
  propertyName = 'Parcela recreativa',
}: PropertyVisualGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState<string>(
    heroImageIds[0] ?? galleryImages[0]?.id ?? '',
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHeroHovered, setIsHeroHovered] = useState(false)

  const imageMap = useMemo(() => new Map(galleryImages.map((image) => [image.id, image])), [galleryImages])
  const heroImages = useMemo(
    () =>
      heroImageIds
        .map((id) => imageMap.get(id))
        .filter((image): image is PropertyGalleryImage => Boolean(image)),
    [heroImageIds, imageMap],
  )

  const selectedIndex = Math.max(galleryImages.findIndex((image) => image.id === selectedImageId), 0)
  const selectedImage = galleryImages[selectedIndex] ?? heroImages[0] ?? galleryImages[0]
  const isAutoplayPaused = isExpanded || isHeroHovered

  function showImageAt(index: number) {
    if (galleryImages.length === 0) {
      return
    }

    const nextIndex = (index + galleryImages.length) % galleryImages.length
    setSelectedImageId(galleryImages[nextIndex].id)
  }

  useEffect(() => {
    const hasSelectedImage = galleryImages.some((image) => image.id === selectedImageId)
    if (!hasSelectedImage && galleryImages.length > 0) {
      setSelectedImageId(heroImageIds[0] ?? galleryImages[0].id)
    }
  }, [galleryImages, heroImageIds, selectedImageId])

  useEffect(() => {
    if (isAutoplayPaused || heroImages.length <= 1) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      const currentHeroIndex = Math.max(
        heroImages.findIndex((image) => image.id === selectedImageId),
        0,
      )
      const nextHero = heroImages[(currentHeroIndex + 1) % heroImages.length]
      setSelectedImageId(nextHero.id)
    }, HERO_AUTOPLAY_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [heroImages, isAutoplayPaused, selectedImageId])

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          className={cn(
            'grid gap-4 transition-[transform,filter,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_18rem]',
            isExpanded && 'scale-[0.985] opacity-25 blur-[3px] saturate-75',
          )}
        >
          <Card className="overflow-hidden rounded-[1.2rem] border-border-soft/80 p-0 shadow-panel">
            <CardContent className="gap-0 p-0">
              <div
                className="group relative overflow-hidden rounded-t-[1.2rem]"
                onMouseEnter={() => setIsHeroHovered(true)}
                onMouseLeave={() => setIsHeroHovered(false)}
              >
                <div className="relative h-[21.5rem] sm:h-[24rem] lg:h-[26.5rem] xl:h-[28.5rem]">
                  <GalleryImage
                    className="gallery-reveal"
                    image={selectedImage}
                    key={selectedImage.id}
                    loading="eager"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[rgb(var(--primitive-color-forest-900)/0.46)] via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgb(var(--primitive-color-forest-900)/0.38)] via-[rgb(var(--primitive-color-forest-900)/0.1)] to-transparent" />

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
                    <Badge className="border-white/18 bg-[rgb(var(--primitive-color-forest-900)/0.64)] text-white shadow-soft backdrop-blur-md">
                      Galeria real
                    </Badge>
                    <div className="rounded-full border border-white/18 bg-[rgb(var(--primitive-color-forest-900)/0.52)] px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white shadow-soft backdrop-blur-md">
                      {selectedIndex + 1} / {galleryImages.length}
                    </div>
                  </div>

                  <div className="absolute inset-y-0 left-0 flex items-center p-3 sm:p-4">
                    <button
                      aria-label="Foto anterior"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgb(var(--primitive-color-forest-900)/0.52)] text-base text-white shadow-soft backdrop-blur-md transition-[transform,background-color,border-color] duration-swift ease-emphasized hover:-translate-x-0.5 hover:border-white/28 hover:bg-[rgb(var(--primitive-color-forest-900)/0.68)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                      onClick={() => showImageAt(selectedIndex - 1)}
                      type="button"
                    >
                      <span aria-hidden="true">&larr;</span>
                    </button>
                  </div>

                  <div className="absolute inset-y-0 right-0 flex items-center p-3 sm:p-4">
                    <button
                      aria-label="Foto siguiente"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgb(var(--primitive-color-forest-900)/0.52)] text-base text-white shadow-soft backdrop-blur-md transition-[transform,background-color,border-color] duration-swift ease-emphasized hover:translate-x-0.5 hover:border-white/28 hover:bg-[rgb(var(--primitive-color-forest-900)/0.68)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                      onClick={() => showImageAt(selectedIndex + 1)}
                      type="button"
                    >
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-b-[1.2rem] border-t border-border-soft/80 bg-panel/95 px-4 py-6 sm:px-5 sm:py-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                        {propertyName}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-border-strong" />
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                        {selectedImage.area}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-display text-[clamp(1.35rem,1.15rem+0.7vw,1.9rem)] leading-tight text-text-primary">
                        {selectedImage.label}
                      </h2>
                      <p className="max-w-xl text-sm leading-6 text-text-secondary">
                        {selectedImage.caption}
                      </p>
                      {propertyDescription ? (
                        <p className="hidden max-w-2xl text-sm leading-6 text-text-tertiary xl:block">
                          {propertyDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <LinkButton
                      className="h-11 rounded-full border-accent/80 bg-[linear-gradient(135deg,rgb(var(--color-accent)),rgb(176_217_119/0.94))] px-5 text-sm font-semibold shadow-[0_1.1rem_2.4rem_rgba(132,188,105,0.28)] hover:shadow-[0_1.35rem_2.7rem_rgba(132,188,105,0.34)]"
                      to="/#seccion-disponibilidad"
                    >
                      Consultar disponibilidad
                    </LinkButton>
                    <LinkButton
                      className="h-11 rounded-full border-border-strong/90 bg-panel/92 px-5 text-sm font-semibold shadow-[0_0.85rem_2rem_rgba(0,0,0,0.18)] hover:border-accent/40 hover:bg-panel-muted"
                      to="/reservar"
                      variant="secondary"
                    >
                      Solicitar reserva
                    </LinkButton>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.2rem] border-border-soft/80 p-0 shadow-soft">
            <CardContent className="gap-3 p-3">
              <div className="flex items-center justify-between gap-3 px-1 pt-1">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                    Navegacion visual
                  </p>
                </div>
              </div>

              <button
                aria-expanded={isExpanded}
                className="inline-flex h-9 items-center justify-center rounded-full border border-border-strong bg-panel px-4 text-sm font-medium text-text-primary transition-[transform,border-color,background-color] duration-swift ease-emphasized hover:-translate-y-px hover:border-accent/45 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                onClick={() => setIsExpanded((current) => !current)}
                type="button"
              >
                {isExpanded
                  ? 'Ocultar galeria completa'
                  : `Ver las ${galleryImages.length} fotos`}
              </button>

              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] lg:max-h-[32.25rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1 lg:[scrollbar-color:rgba(132,188,105,0.65)_rgba(255,255,255,0.06)] lg:[scrollbar-width:auto] lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-track]:rounded-full lg:[&::-webkit-scrollbar-track]:bg-white/5 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-accent/75 lg:[&::-webkit-scrollbar-thumb:hover]:bg-accent">
                {galleryImages.map((image, index) => {
                  const isSelected = image.id === selectedImage.id

                  return (
                    <button
                      aria-current={isSelected ? 'true' : undefined}
                      aria-label={`Seleccionar ${image.label}`}
                      className={cn(
                        'group relative h-20 min-w-36 shrink-0 overflow-hidden rounded-2xl border bg-panel-muted text-left shadow-soft outline-none transition-[transform,border-color,box-shadow] duration-swift ease-emphasized hover:-translate-y-0.5 hover:border-accent/45 focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)] lg:h-auto lg:min-h-0 lg:min-w-0 lg:w-full lg:aspect-[16/9] lg:shrink-0',
                        isSelected
                          ? 'border-accent bg-accent-soft/35 shadow-lift'
                          : 'border-border-soft',
                      )}
                      key={image.id}
                      onClick={() => setSelectedImageId(image.id)}
                      type="button"
                    >
                      <GalleryImage image={image} />
                      <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--primitive-color-forest-900)/0.58)] via-[rgb(var(--primitive-color-forest-900)/0.12)] to-[rgb(var(--primitive-color-forest-900)/0.06)] lg:bg-gradient-to-t lg:from-[rgb(var(--primitive-color-forest-900)/0.78)] lg:via-[rgb(var(--primitive-color-forest-900)/0.18)] lg:to-transparent" />
                      <div className="absolute inset-0 flex items-end justify-between gap-3 p-3.5">
                        <div className="min-w-0">
                          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/62">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-white">
                            {image.label}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'h-2.5 w-2.5 shrink-0 rounded-full border border-white/30',
                            isSelected ? 'bg-accent' : 'bg-white/20',
                          )}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          aria-hidden={!isExpanded}
          className={cn(
            'pointer-events-none absolute inset-0 z-20 transition-[opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isExpanded && 'pointer-events-auto',
          )}
        >
          <Card
            className={cn(
              'absolute right-0 top-0 h-full w-full origin-top-right overflow-hidden rounded-[1.2rem] border-border-soft/80 bg-[linear-gradient(180deg,rgb(var(--color-panel)),rgb(var(--color-panel-muted)/0.98)_100%)] p-0 shadow-[0_2rem_5rem_rgba(0,0,0,0.34)] transition-[transform,opacity,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              isExpanded
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-6 scale-[0.82] opacity-0',
            )}
          >
            <CardContent className="flex h-full flex-col gap-0 p-0">
              <div className="relative overflow-hidden rounded-t-[1.2rem] border-b border-border-soft/80 px-4 py-4 sm:px-5 sm:py-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[1.2rem] bg-[radial-gradient(ellipse_at_top_right,rgba(132,188,105,0.24),rgba(132,188,105,0.14)_28%,transparent_70%)]" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <Badge tone="neutral">{galleryImages.length} fotos</Badge>
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-full border border-border-strong bg-panel px-4 text-sm font-medium text-text-primary transition-[transform,border-color,background-color] duration-swift ease-emphasized hover:-translate-y-px hover:border-accent/45 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
                    onClick={() => setIsExpanded(false)}
                    type="button"
                  >
                    Volver a la barra lateral
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(132,188,105,0.65)_rgba(255,255,255,0.06)] [scrollbar-width:auto] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-accent/75 [&::-webkit-scrollbar-thumb:hover]:bg-accent">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {galleryImages.map((image, index) => {
                      const isSelected = image.id === selectedImage.id

                      return (
                        <button
                          aria-current={isSelected ? 'true' : undefined}
                          aria-label={`Ver ${image.label}`}
                          className={cn(
                            'group relative overflow-hidden rounded-[1.25rem] border bg-panel-muted text-left shadow-soft outline-none transition-[transform,opacity,filter,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-accent/45 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]',
                            resolveAspectClass(image),
                            isSelected
                              ? 'border-accent shadow-lift'
                              : 'border-border-soft',
                            isExpanded
                              ? 'translate-y-0 opacity-100 blur-0'
                              : 'translate-y-6 opacity-0 blur-[3px]',
                          )}
                          key={image.id}
                          onClick={() => setSelectedImageId(image.id)}
                          style={{
                            transitionDelay: isExpanded ? `${80 + index * 18}ms` : '0ms',
                          }}
                          type="button"
                        >
                          <GalleryImage image={image} />
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--primitive-color-forest-900)/0.72)] via-[rgb(var(--primitive-color-forest-900)/0.08)] to-transparent opacity-88 transition-opacity duration-swift group-hover:opacity-100" />
                          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                            <div className="max-w-[15.5rem] rounded-[0.95rem] border border-white/10 bg-[rgb(var(--primitive-color-forest-900)/0.44)] px-3.5 py-2.5 backdrop-blur-md">
                              <p className="font-display text-[1rem] leading-tight text-white">
                                {image.label}
                              </p>
                              <p className="mt-1.5 text-[0.84rem] leading-5 text-white/84">
                                {image.caption}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
