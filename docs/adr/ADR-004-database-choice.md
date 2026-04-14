# ADR-004: PostgreSQL como base de datos principal

## Estado
Aprobada

## Contexto

El dominio de reservas necesita consistencia transaccional, consultas relacionales claras y un camino serio de evolucion para estados, pricing, bloqueos y comprobantes.

## Decision

Usar PostgreSQL como base de datos principal del sistema y levantarlo localmente via Docker Compose en desarrollo.

## Consecuencias

- el entorno local queda alineado con una base relacional de produccion;
- se evita depender de SQLite para una aplicacion transaccional que crecera en complejidad;
- la configuracion compartida por `.env` simplifica el desarrollo entre frontend, backend e infraestructura.
