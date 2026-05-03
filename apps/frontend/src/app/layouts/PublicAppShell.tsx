import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Container } from '@/design-system'
import { LinkButton } from '@/shared/ui/LinkButton'
import { ThemeModeToggle } from '@/shared/theme/ThemeModeToggle'

const navigationItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Disponibilidad', to: '/', hash: '#seccion-disponibilidad' },
  { label: 'Reservar', to: '/reservar' },
  { label: 'Seguimiento', to: '/seguimiento' },
  { label: 'Comprobante', to: '/comprobante' },
]

function getNavLinkClassName(isActive: boolean) {
  return [
    'nav-pill-link rounded-full border px-3 py-2 text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-swift ease-emphasized',
    isActive
      ? 'border-border-strong/90 bg-panel-elevated/95 text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_32px_rgba(0,0,0,0.18)]'
      : 'border-transparent text-text-secondary hover:-translate-y-px hover:border-accent/35 hover:bg-panel-muted/88 hover:text-text-primary hover:shadow-[0_1rem_2.2rem_rgba(0,0,0,0.16)]',
  ].join(' ')
}

export function PublicAppShell() {
  const location = useLocation()
  const navigate = useNavigate()

  function isAvailabilityLinkActive() {
    return (
      location.pathname === '/disponibilidad' ||
      (location.pathname === '/' && location.hash === '#seccion-disponibilidad')
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border-soft/70 bg-canvas/78 backdrop-blur-xl">
        <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 md:right-3">
          <ThemeModeToggle compact />
        </div>

        <Container className="relative" width="wide">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-4 pr-28 md:pr-32">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-accent-contrast shadow-soft">
                AP
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  app_web_parcela
                </p>
                <p className="text-sm text-text-primary">Experiencia pública de reservas</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-1">
              {navigationItems.map((item) => (
                item.hash ? (
                  <button
                    className={getNavLinkClassName(isAvailabilityLinkActive())}
                    key={`${item.to}${item.hash}`}
                    onClick={() => navigate({ hash: item.hash, pathname: item.to })}
                    type="button"
                  >
                    {item.label}
                  </button>
                ) : (
                  <NavLink
                    className={({ isActive }) => getNavLinkClassName(isActive)}
                    key={item.to}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                )
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <LinkButton to="/reservar">Reservar</LinkButton>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border-soft/70 py-10">
        <Container width="wide">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-tertiary">
                Base pública lista para crecer
              </p>
              <p className="max-w-3xl text-sm leading-8 text-text-secondary">
                Esta capa ya conversa con la API real del producto: información pública, disponibilidad, solicitud invitada, seguimiento y carga de comprobantes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton to="/seguimiento" variant="secondary">
                Consultar reserva
              </LinkButton>
              <LinkButton to="/lab/design-system" variant="ghost">
                Ver design system
              </LinkButton>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
