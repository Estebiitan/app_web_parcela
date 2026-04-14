# Arquitectura frontend

## Estado actual

El frontend ya no es solo una base visual. Hoy tiene tres capas claras: aplicacion, modulos de producto y sistema de diseño.

- `src/app`: router, shell publico, pagina 404 y preview interna;
- `src/modules/public-site`: home, detalle de parcela y consumo de informacion publica;
- `src/modules/availability`: consulta publica de fechas y cotizacion;
- `src/modules/reservations`: solicitud invitada, confirmacion y seguimiento;
- `src/modules/payments`: carga invitada de comprobantes;
- `src/design-system/tokens`: tokens CSS por capas y contratos TypeScript;
- `src/design-system/primitives`: primitivas base de superficie;
- `src/design-system/components`: componentes reutilizables;
- `src/design-system/layouts`: piezas estructurales de pagina;
- `src/shared/api`: cliente HTTP y manejo base de errores;
- `src/shared/config/env.ts`: acceso tipado a variables Vite;
- `src/shared/hooks`: hooks transversales;
- `src/shared/ui`: piezas reutilizables no ligadas a un solo dominio;
- `src/styles`: importacion global de tokens y estilos base;
- `vite.config.ts`: alias `@/*` y `envDir` apuntando al `.env` del repositorio.

## Responsabilidades actuales

### `src/app`

Responsabilidad: bootstrap de la aplicacion y composicion de alto nivel.

Hoy contiene:

- router;
- shell publico;
- pagina 404;
- preview del design system.

### `src/modules/*`

Responsabilidad: flujo de producto por dominio o caso de uso.

Hoy ya contiene:

- `public-site` para informacion general y narrativa de la parcela;
- `availability` para consulta por rango;
- `reservations` para creacion, confirmacion y seguimiento de la reserva invitada;
- `payments` para carga de comprobantes en el flujo invitado.

Regla:

- cada modulo conoce sus tipos, endpoints, paginas y componentes;
- los modulos no deben esconder adaptadores HTTP dentro de componentes visuales.

### `src/design-system`

Responsabilidad: lenguaje visual comun de toda la aplicacion.

Permitido:

- tokens;
- primitives;
- componentes agnosticos al dominio;
- layouts reutilizables.

No permitido:

- reglas de reserva;
- comportamiento de negocio;
- adaptadores HTTP de dominio.

### `src/shared`

Responsabilidad: piezas transversales y agnosticas al dominio.

Permitido:

- cliente HTTP base;
- configuracion;
- hooks realmente transversales;
- componentes visuales reutilizables;
- helpers realmente compartidos.

No permitido:

- logica de reservas;
- reglas de pricing;
- estado especifico de modulos de negocio.

### `src/styles`

Responsabilidad: ensamblar el sistema visual global importando tokens y estilos base.

## Direccion de crecimiento recomendada

La estructura sugerida ya esta parcialmente instalada:

- `src/app`
- `src/shared`
- `src/modules/public-site`
- `src/modules/availability`
- `src/modules/reservations`
- `src/modules/payments`
- `src/modules/admin` cuando aparezca el panel administrativo

Cada modulo deberia contener lo necesario para su area:

- componentes;
- hooks;
- adaptadores de API;
- tipos del modulo;
- vistas internas del dominio.

## Reglas para no degradar el frontend

1. `App.tsx` no debe transformarse en una pantalla gigante con toda la logica.
2. Los adaptadores HTTP deben vivir fuera de componentes de presentacion.
3. `shared/` no debe importar modulos de negocio.
4. `design-system/` no debe recibir componentes acoplados a dominio.
5. Los componentes de pagina componen; no concentran toda la logica de datos.
6. El sistema visual debe crecer desde tokens y componentes, no desde copias de clases utilitarias sin criterio.

## Integracion con el backend

La integracion debe hacerse contra contratos versionados en `/api/v1`.

Regla recomendada:

- encapsular llamadas HTTP por modulo;
- tipar respuestas por recurso;
- evitar que componentes visuales dependan de detalles de autenticacion o fetch.

## Siguiente paso natural

La siguiente iteracion natural es sumar:

- area autenticada de cliente sobre el flujo ya existente;
- panel administrativo en `src/modules/admin`;
- mejoras de persistencia de sesion y feedback transaccional;
- componentes de tabla, filtros y estados de revision para la operacion.
