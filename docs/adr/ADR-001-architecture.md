# ADR-001: Monorepo modular desde el inicio

## Estado
Aprobada

## Contexto

El proyecto necesita convivir con una SPA, una API, infraestructura local y documentacion tecnica. En etapas tempranas es comun mezclar estas piezas o repartirlas en repositorios prematuramente, lo que suele encarecer cambios coordinados.

## Decision

Organizar el proyecto como monorepo con separacion explicita por contexto:

- `apps/frontend`
- `apps/backend`
- `infra/docker`
- `docs`

## Consecuencias

- permite evolucionar frontend y backend como una sola unidad de producto;
- simplifica configuracion compartida por entorno;
- reduce el riesgo de estructuras improvisadas en fases tempranas.
