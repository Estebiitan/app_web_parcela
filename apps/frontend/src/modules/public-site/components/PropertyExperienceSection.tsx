import type { PointerEvent } from 'react'

import { Card, CardContent } from '@/design-system'
import {
  defaultExperienceCards,
  type ExperienceCard,
  FeatureIcon,
} from '@/modules/public-site/content/experienceCards'

type PropertyExperienceSectionProps = {
  cards?: ExperienceCard[]
}

function updateSpotlightPosition(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType === 'touch') {
    return
  }

  const bounds = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top

  event.currentTarget.style.setProperty('--experience-spotlight-x', `${x}px`)
  event.currentTarget.style.setProperty('--experience-spotlight-y', `${y}px`)
}

function clearSpotlightPosition(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty('--experience-spotlight-x')
  event.currentTarget.style.removeProperty('--experience-spotlight-y')
}

function ExperienceCardItem({ item }: { item: ExperienceCard }) {
  return (
    <Card
      className="experience-spotlight-card group translate-y-0 transform-gpu border-border-soft/80 bg-panel-muted/55 p-0 shadow-soft transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-accent/28 hover:bg-panel-muted/72 hover:shadow-lift"
      onPointerEnter={updateSpotlightPosition}
      onPointerLeave={clearSpotlightPosition}
      onPointerMove={updateSpotlightPosition}
    >
      <CardContent className="gap-2 p-3">
        <div className="experience-card-icon flex h-10 w-10 items-center justify-center rounded-2xl bg-accent shadow-soft transition-[transform,background-color,box-shadow] duration-swift ease-emphasized group-hover:-translate-y-0.5 group-hover:shadow-[0_1.2rem_2.4rem_rgba(132,188,105,0.26)]">
          <FeatureIcon name={item.icon} />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-[1.12rem] leading-tight text-text-primary">
            {item.title}
          </h3>
          <p className="text-sm leading-[1.65] text-text-secondary">{item.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PropertyExperienceSection({
  cards = defaultExperienceCards,
}: PropertyExperienceSectionProps) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => (
          <ExperienceCardItem item={item} key={item.title} />
        ))}
      </div>
    </div>
  )
}
