# Reglas del design system

## Estructura real instalada

El frontend ahora tiene una estructura dedicada para el sistema de diseño:

- `src/design-system/tokens`
  - `primitive.css`
  - `semantic.css`
  - `components.css`
  - `contract.ts`
- `src/design-system/primitives`
  - `Surface.tsx`
- `src/design-system/components`
  - `Button.tsx`
  - `Input.tsx`
  - `Card.tsx`
  - `Badge.tsx`
- `src/design-system/layouts`
  - `Container.tsx`
  - `Section.tsx`
  - `PageHeader.tsx`
- `src/shared/typography`
  - `TypographyProvider.tsx`
  - `TypographyModePanel.tsx`
  - `typographyContext.ts`
- `src/styles/index.css`
  - importa tokens y define estilos base/globales

## Modelo de tokens por capas

### Primitive tokens

Definen materia prima visual:

- escalas de color base;
- spacing;
- radios;
- sombras;
- tipografia via variables globales;
- duraciones y curvas de movimiento.

No expresan intencion de producto, solo valores fundacionales.

### Semantic tokens

Traducen primitives a significado de interfaz:

- `color-canvas`
- `color-panel`
- `color-text-primary`
- `color-border-soft`
- `color-accent`
- `color-success`
- `color-warning`
- `color-danger`
- `color-info`

Aqui tambien vive dark mode.

### Component tokens

Definen contratos de componentes:

- alturas de boton;
- paddings de input;
- padding y radio de card;
- gutters y max-width de layout;
- medidas de focus ring.

## Dark mode

Dark mode ya esta listo y operativo.

Reglas implementadas:

- modo explicito via `data-theme="light"` o `data-theme="dark"`;
- fallback a preferencia del sistema cuando no existe override;
- `color-scheme` sincronizado con el tema activo;
- tokens semanticos adaptados por tema, sin duplicar componentes.

## Tipografia configurable

La tipografia ya no esta fija en una sola combinacion.

Reglas implementadas:

- la app completa usa `--font-family-sans`, `--font-family-display` y `--font-family-mono`;
- esos tokens viven en `primitive.css`;
- las familias ya no dependen solo de fuentes del sistema; el frontend bundle incluye fuentes reales via `@fontsource`;
- el documento cambia de preset via `data-typography`;
- el estado se persiste desde `TypographyProvider`;
- el panel del design system permite comparar presets sin reescribir componentes.

Presets actuales:

- `editorial`
- `modern`
- `humanist`
- `classic`
- `grotesk`
- `condensed`
- `technical`
- `warm`

## Reglas para evitar spaghetti visual

1. Ningun componente de producto debe introducir colores directos si ya existe una categoria de token para esa necesidad.
2. Los valores de motion deben salir de tokens, no de duraciones ad hoc por componente.
3. La tipografia se cambia desde presets globales, no desde `font-family` hardcodeado en pantallas o features.
4. `primitives` no conocen dominio.
5. `components` combinan primitives y tokens, pero siguen siendo agnosticos al negocio.
6. `layouts` resuelven estructura y ritmo de pagina, no reglas de producto.
7. Si una pieza conoce reservas, pagos o administracion, no pertenece al design system.
8. El design system crece de abajo hacia arriba: tokens -> primitives -> components -> layouts -> modulos.

## Motion y transiciones

El sistema ya define tokens para animacion y transicion:

- `--motion-duration-micro`
- `--motion-duration-swift`
- `--motion-duration-smooth`
- `--motion-duration-settle`
- `--motion-ease-standard`
- `--motion-ease-emphasized`
- `--motion-ease-decelerated`

Reglas:

- priorizar `transform`, `opacity`, `background-color`, `border-color` y `box-shadow`;
- evitar animaciones pesadas sobre layout cuando no sean necesarias;
- respetar `prefers-reduced-motion`;
- usar motion como feedback de calidad, no como decoracion gratuita.

## Integracion con Tailwind

Tailwind no es la fuente del sistema; es la capa de consumo.

Regla:

- los tokens viven en CSS variables;
- Tailwind mapea esos tokens a utilidades;
- los componentes usan esas utilidades y variables;
- las pantallas no deberian definir sistemas paralelos.

## Uso recomendado de carpetas

### `tokens`

Solo variables y contratos tipados.

### `primitives`

Bloques visuales minimos como superficies y contenedores base.

### `components`

Piezas reutilizables listas para formularios, acciones, estado y composicion.

### `layouts`

Estructura reusable de pagina y seccion.

## Base visual actual

La base instalada apunta a una estetica:

- moderna;
- limpia;
- sobria;
- premium;
- orientada a producto operativo.

Se apoya en:

- contraste controlado;
- superficies diferenciadas;
- tipografia seria;
- spacing amplio y consistente;
- sombras suaves;
- motion discreta y fluida.

## Proxima evolucion recomendada

- agregar `Textarea`, `Select`, `Checkbox`, `Dialog`, `Tabs` y `Table`;
- documentar variantes permitidas por componente;
- crear iconografia base;
- introducir estados de formulario completos;
- montar una libreria de features sobre esta base sin romper consistencia.
