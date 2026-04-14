# ADR-002: Frontend con React, Vite, TypeScript y Tailwind

## Estado
Aprobada

## Contexto

La aplicacion necesita una base rapida de desarrollo, tipada y facil de escalar hacia modulos funcionales. Tambien necesita un sistema visual que pueda crecer sin quedar atado a estilos dispersos por pantalla.

## Decision

Usar:

- React 19
- Vite
- TypeScript
- Tailwind CSS
- tokens de diseño propios en CSS variables

## Consecuencias

- React permite escalar la UI por componentes y modulos;
- Vite acelera el entorno local;
- TypeScript ayuda a sostener contratos estables;
- Tailwind se usa como capa de composicion visual, no como reemplazo del design system;
- los tokens actuales preparan el camino para un sistema visual consistente.
