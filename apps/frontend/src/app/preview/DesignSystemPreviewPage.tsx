import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  Input,
  PageHeader,
  Section,
  Surface,
  badgeTones,
  buttonSizes,
  buttonVariants,
  componentTokenGroups,
  primitiveTokenGroups,
  semanticTokenGroups,
} from '@/design-system'
import { env } from '@/shared/config/env'
import { ThemeModeToggle } from '@/shared/theme/ThemeModeToggle'
import { TypographyModePanel } from '@/shared/typography/TypographyModePanel'
import { useTypography } from '@/shared/typography/typographyContext'

const colorSwatches = [
  { label: 'Canvas', token: '--color-canvas', textClassName: 'text-text-primary' },
  { label: 'Panel', token: '--color-panel', textClassName: 'text-text-primary' },
  { label: 'Accent', token: '--color-accent', textClassName: 'text-text-inverse' },
  { label: 'Success', token: '--color-success', textClassName: 'text-text-inverse' },
  { label: 'Warning', token: '--color-warning', textClassName: 'text-text-inverse' },
  { label: 'Danger', token: '--color-danger', textClassName: 'text-text-inverse' },
  { label: 'Info', token: '--color-info', textClassName: 'text-text-inverse' },
] as const

function TokenCard({
  title,
  items,
}: {
  title: string
  items: readonly string[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          Tokens documentados para crecer sin hardcodes.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-border-soft bg-panel-muted px-3 py-2 font-mono text-xs text-text-secondary"
          >
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ColorSwatch({
  label,
  token,
  textClassName,
}: {
  label: string
  token: string
  textClassName: string
}) {
  return (
    <div className="space-y-3">
      <div
        className={`h-24 rounded-xl border border-border-soft shadow-soft ${textClassName}`}
        style={{ backgroundColor: `rgb(var(${token}))` }}
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="font-mono text-xs text-text-tertiary">{token}</p>
      </div>
    </div>
  )
}

export function DesignSystemPreviewPage() {
  const { mode: typographyMode } = useTypography()

  return (
    <main className="pb-16">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <ThemeModeToggle />
          </div>
        }
        description="Base sofisticada del Design System para app_web_parcela. Tokens en capas, dark mode, tipografía configurable, motion fluida y componentes listos para construir el producto sin estilos improvisados."
        eyebrow="Design System"
        metadata={
          <>
            <Badge tone="neutral">React + Tailwind + CSS variables</Badge>
            <Badge tone="info">API base: {env.apiBaseUrl}</Badge>
            <Badge tone="accent">Tipografía activa: {typographyMode}</Badge>
          </>
        }
        title="Sistema visual premium, reusable y preparado para escalar."
      />

      <Section
        description="La tipografía ahora es una capacidad real del sistema. El selector cambia el documento completo y permite evaluar la voz visual de la plataforma sin hardcodear estilos por pantalla."
        eyebrow="Typography"
        title="Dirección tipográfica global"
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <TypographyModePanel />
          <Card>
            <CardHeader>
              <CardTitle>Preview aplicado</CardTitle>
              <CardDescription>
                El preset elegido afecta `body`, `font-display` y todos los componentes que consumen el contrato tipográfico del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Headline
                </p>
                <h3 className="font-display text-[clamp(2rem,1.6rem+1vw,3rem)] leading-[1.03] text-text-primary">
                  Reservas con una narrativa visual coherente y adaptable.
                </h3>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Body copy
                </p>
                <p className="text-base leading-8 text-text-secondary">
                  Cada preset reorganiza el tono percibido del producto sin duplicar clases ni reescribir componentes. La app entera hereda el cambio desde variables y contratos tipográficos centralizados.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border-soft bg-panel-muted px-4 py-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  Token source
                </p>
                <p className="mt-2 font-mono text-xs leading-7 text-text-secondary">
                  --font-family-sans / --font-family-display / --font-family-mono
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        description="La estructura separa primitive tokens, semantic tokens y component tokens. Los componentes usan esos contratos; las pantallas solo componen."
        eyebrow="Fundaciones"
        title="Arquitectura visual instalada"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <TokenCard
            items={[
              ...primitiveTokenGroups.color,
              ...primitiveTokenGroups.spacing,
              ...primitiveTokenGroups.motion,
            ]}
            title="Primitive tokens"
          />
          <TokenCard
            items={[
              ...semanticTokenGroups.surface,
              ...semanticTokenGroups.text,
              ...semanticTokenGroups.feedback,
            ]}
            title="Semantic tokens"
          />
          <TokenCard
            items={[
              ...componentTokenGroups.button,
              ...componentTokenGroups.input,
              ...componentTokenGroups.card,
            ]}
            title="Component tokens"
          />
        </div>
      </Section>

      <Section
        description="Los colores visibles nacen desde tokens semanticos. El preview muestra superficies y feedback principales del sistema."
        eyebrow="Tokens"
        title="Escala semantica principal"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {colorSwatches.map((swatch) => (
            <ColorSwatch key={swatch.token} {...swatch} />
          ))}
        </div>
      </Section>

      <Section
        description="Los botones ya comparten alturas, ritmo de interacción, easing y variantes orientadas a producto."
        eyebrow="Components"
        title="Buttons y badges"
      >
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Button variants</CardTitle>
              <CardDescription>
                Variantes tipadas, consistentes y listas para acciones de producto.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5">
              {buttonSizes.map((size) => (
                <div key={size} className="flex flex-wrap items-center gap-3">
                  {buttonVariants.map((variant) => (
                    <Button key={`${size}-${variant}`} size={size} variant={variant}>
                      {variant} {size}
                    </Button>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badge tones</CardTitle>
              <CardDescription>
                Estados compactos para contexto, estado y clasificación.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {badgeTones.map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        description="Inputs, cards y containers ya respetan spacing, radius, sombras y motion del sistema."
        eyebrow="Layouts"
        title="Primitives, components y layouts"
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
          <Surface className="grid gap-6 rounded-2xl bg-panel p-6 shadow-panel" tone="muted">
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-text-primary">
                Form primitives
              </h3>
              <p className="text-sm leading-7 text-text-secondary">
                Controles listos para formularios de solicitud de reserva y flujos
                administrativos.
              </p>
            </div>
            <Input
              hint="Se usara como identificador principal del usuario."
              id="preview-email"
              label="Correo de contacto"
              placeholder="cliente@parcela.cl"
              type="email"
            />
            <Input
              error="El comprobante debe asociarse a una reserva existente."
              id="preview-reference"
              label="Referencia de pago"
              placeholder="R-2026-0041"
            />
            <div className="flex flex-wrap gap-3">
              <Button>Guardar cambios</Button>
              <Button variant="secondary">Cancelar</Button>
            </div>
          </Surface>

          <div className="grid gap-6">
            <Container className="rounded-2xl border border-border-soft bg-panel p-0 shadow-soft" width="full">
              <div className="grid gap-5 p-6 lg:grid-cols-2">
                <Card className="bg-panel-muted">
                  <CardHeader>
                    <Badge tone="accent">Container</Badge>
                    <CardTitle>Contención consistente</CardTitle>
                    <CardDescription>
                      `Container` centraliza ancho máximo y gutters para no repetir layout.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Badge tone="success">Motion</Badge>
                    <CardTitle>Interacciones suaves</CardTitle>
                    <CardDescription>
                      Las transiciones priorizan transform, opacity y color para
                      mantener sensación fluida y liviana.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </Container>

            <Card>
              <CardHeader>
                <CardTitle>Card composition</CardTitle>
                <CardDescription>
                  La card ya resuelve padding, radius, surface y footer para casos de producto.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-accent-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accent-emphasis">
                    Solicitudes activas
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-text-primary">12</p>
                </div>
                <div className="rounded-lg bg-warning-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-warning">
                    En observacion
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-text-primary">3</p>
                </div>
                <div className="rounded-lg bg-info-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-info">
                    Pagos pendientes
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-text-primary">4</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">
                  Ver detalle
                </Button>
                <Button size="sm" variant="ghost">
                  Exportar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Section>
    </main>
  )
}
