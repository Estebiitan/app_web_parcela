type FeatureIconName =
  | 'pool'
  | 'table'
  | 'leaf'
  | 'sport'
  | 'spark'
  | 'car'
  | 'support'
  | 'game'
  | 'shower'
  | 'kitchen'
  | 'microwave'
  | 'kettle'
  | 'fridge'
  | 'volleyball'
  | 'grill'

export type { FeatureIconName }

export type ExperienceCard = {
  description: string
  icon: FeatureIconName
  title: string
}

export const featureIconOptions: FeatureIconName[] = [
  'pool',
  'table',
  'leaf',
  'sport',
  'spark',
  'car',
  'support',
  'game',
  'shower',
  'kitchen',
  'microwave',
  'kettle',
  'fridge',
  'volleyball',
  'grill',
]

export const defaultExperienceCards: ExperienceCard[] = [
  {
    title: 'Piscina',
    description: 'Piscina amplia para refrescarse y disfrutar durante toda la jornada.',
    icon: 'pool',
  },
  {
    title: 'Quincho exterior',
    description: 'Espacio techado para comidas, pausas y organizacion del encuentro.',
    icon: 'table',
  },
  {
    title: 'Areas verdes',
    description: 'Jardines amplios para circular, descansar y compartir al aire libre.',
    icon: 'leaf',
  },
  {
    title: 'Parrillas',
    description: 'Parrillas disponibles para asados, comidas y encuentros al aire libre.',
    icon: 'grill',
  },
  {
    title: 'Mesa de ping pong',
    description: 'Mesa disponible para partidas recreativas durante el evento.',
    icon: 'game',
  },
  {
    title: 'Taca taca',
    description: 'Juego clasico para sumar entretencion y dinamica grupal.',
    icon: 'game',
  },
  {
    title: 'Cama elastica',
    description: 'Espacio pensado para diversion infantil y energia al aire libre.',
    icon: 'spark',
  },
  {
    title: 'Duchas',
    description: 'Duchas disponibles para mayor comodidad durante la estadia.',
    icon: 'shower',
  },
  {
    title: 'Cocina',
    description: 'Area de apoyo para preparar, organizar y servir alimentos.',
    icon: 'kitchen',
  },
  {
    title: 'Microondas',
    description: 'Microondas habilitado para calentar y apoyar el servicio.',
    icon: 'microwave',
  },
  {
    title: 'Hervidor',
    description: 'Hervidor disponible para bebidas calientes y apoyo de cocina.',
    icon: 'kettle',
  },
  {
    title: 'Refrigeradores',
    description: 'Espacio de refrigeracion para bebidas, alimentos y abastecimiento.',
    icon: 'fridge',
  },
  {
    title: 'Cancha futbol',
    description: 'Cancha habilitada para pichangas y actividad deportiva grupal.',
    icon: 'sport',
  },
  {
    title: 'Cancha voleibol',
    description: 'Espacio disponible para partidos recreativos de voleibol.',
    icon: 'volleyball',
  },
  {
    title: 'Estacionamiento',
    description: 'Llegada comoda para invitados y vehiculos sin tension operativa.',
    icon: 'car',
  },
  {
    title: 'Apoyo operativo',
    description: 'Infraestructura de respaldo para ordenar mejor la jornada o evento.',
    icon: 'support',
  },
]

export function FeatureIcon({ name }: { name: FeatureIconName }) {
  const sharedProps = {
    className: 'h-5 w-5 text-[rgb(var(--color-accent-contrast))]',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  switch (name) {
    case 'pool':
      return (
        <svg {...sharedProps}>
          <path d="M4 16c1.2 0 1.8-.8 3-.8s1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8" />
          <path d="M7 13V8.5A2.5 2.5 0 0 1 9.5 6H17" />
          <path d="M17 6v7" />
        </svg>
      )
    case 'table':
      return (
        <svg {...sharedProps}>
          <path d="M4 9h16" />
          <path d="M6 9v9" />
          <path d="M18 9v9" />
          <path d="M12 9v9" />
          <path d="M5 6h14v3H5z" />
        </svg>
      )
    case 'leaf':
      return (
        <svg {...sharedProps}>
          <path d="M6 14c0-5 4-8 10-8 0 6-3 10-8 10-1.3 0-2-.3-2-.3S6 15.3 6 14Z" />
          <path d="M8 16c2-3 4.7-5 8-6" />
        </svg>
      )
    case 'sport':
      return (
        <svg {...sharedProps}>
          <path d="M4 18V7.5A1.5 1.5 0 0 1 5.5 6H10" />
          <path d="M20 18V7.5A1.5 1.5 0 0 0 18.5 6H14" />
          <path d="M4 18h16" />
          <path d="M12 6v12" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...sharedProps}>
          <path d="m12 3 1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3Z" />
          <path d="m19 15 .8 2 .2.2 2 .8-2 .8-.2.2-.8 2-.8-2-.2-.2-2-.8 2-.8.2-.2.8-2Z" />
        </svg>
      )
    case 'car':
      return (
        <svg {...sharedProps}>
          <path d="M5 15h14" />
          <path d="M7 15 8.2 9.8A2 2 0 0 1 10.1 8h3.8a2 2 0 0 1 1.9 1.8L17 15" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      )
    case 'support':
      return (
        <svg {...sharedProps}>
          <path d="M5 20V9l7-5 7 5v11" />
          <path d="M9 20v-5h6v5" />
        </svg>
      )
    case 'game':
      return (
        <svg {...sharedProps}>
          <rect x="5" y="8" width="14" height="8" rx="3" />
          <path d="M9 12h4" />
          <path d="M11 10v4" />
          <circle cx="15.5" cy="11" r=".8" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="13" r=".8" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'shower':
      return (
        <svg {...sharedProps}>
          <path d="M7 8a5 5 0 0 1 10 0v1H7Z" />
          <path d="M17 9v2" />
          <path d="M10 14v.5" />
          <path d="M13 15v.5" />
          <path d="M16 14v.5" />
          <path d="M9 17v.5" />
          <path d="M12 18v.5" />
          <path d="M15 17v.5" />
        </svg>
      )
    case 'kitchen':
      return (
        <svg {...sharedProps}>
          <path d="M6 5v14" />
          <path d="M10 5v14" />
          <path d="M6 12h4" />
          <path d="M14 5v6a2 2 0 0 0 4 0V5" />
          <path d="M16 13v6" />
        </svg>
      )
    case 'microwave':
      return (
        <svg {...sharedProps}>
          <rect x="4" y="7" width="16" height="10" rx="2" />
          <path d="M7 10h6v4H7z" />
          <path d="M16.5 10v4" />
          <path d="M18 10v4" />
        </svg>
      )
    case 'kettle':
      return (
        <svg {...sharedProps}>
          <path d="M8 11a4 4 0 1 0 8 0V9H8Z" />
          <path d="M16 10h1.5a1.5 1.5 0 0 1 0 3H16" />
          <path d="M10 7c0-1 1-1.5 1-2.5" />
          <path d="M13 7c0-1 1-1.5 1-2.5" />
        </svg>
      )
    case 'fridge':
      return (
        <svg {...sharedProps}>
          <rect x="7" y="4" width="10" height="16" rx="2" />
          <path d="M7 11h10" />
          <path d="M10 8h.01" />
          <path d="M10 15h.01" />
        </svg>
      )
    case 'volleyball':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 5a8 8 0 0 1 4 6" />
          <path d="M8 6a8 8 0 0 0 5 5" />
          <path d="M6 13a8 8 0 0 0 7 1" />
        </svg>
      )
    case 'grill':
      return (
        <svg {...sharedProps}>
          <path d="M7 10h10" />
          <path d="M8 10v4a4 4 0 0 0 8 0v-4" />
          <path d="M10 18v2" />
          <path d="M14 18v2" />
          <path d="M9 6c0-1 1-1.4 1-2.4" />
          <path d="M12 6c0-1 1-1.4 1-2.4" />
          <path d="M15 6c0-1 1-1.4 1-2.4" />
        </svg>
      )
  }
}
