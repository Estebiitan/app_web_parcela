# Arquitectura del sistema

## Estado actual

El repositorio ya esta estructurado como monorepo con separacion clara entre aplicacion web, API, infraestructura local y documentacion:

- `apps/frontend`: SPA en React + Vite + TypeScript.
- `apps/backend`: API en Django + Django REST Framework.
- `infra/docker`: servicios locales compartidos, hoy PostgreSQL.
- `docs`: decisiones, alcance y direccion arquitectonica.

La base implementada hoy cubre:

- frontend inicial con alias `@/*`, Tailwind CSS y tokens de diseño en CSS variables;
- backend modular con `settings` por entorno;
- autenticacion JWT;
- OpenAPI / Swagger;
- modelo de usuario propio autenticado por email;
- informacion publica configurable de la parcela;
- flujo publico de reserva y seguimiento por token de reserva;
- modelo inicial de reservas, pricing, bloqueos, pagos y auditoria;
- configuracion local de PostgreSQL via Docker Compose.

## Estructura actual por capa

### Frontend

- `src/app`: composicion principal de la aplicacion.
- `src/design-system`: tokens, primitives, components y layouts.
- `src/shared/config`: variables de entorno y configuracion compartida.
- `src/shared/lib`: helpers transversales no ligados a dominio.
- `src/styles`: ensamblaje global del sistema visual.

### Backend

- `config/settings`: configuracion base, desarrollo y produccion.
- `config/api`: composicion de rutas API versionadas.
- `apps/common`: preocupaciones transversales del backend.
- `apps/users`: identidad, usuario y autenticacion relacionada.
- `apps/properties`: perfil publico activo de la parcela.
- `apps/availability`: bloqueos de fechas.
- `apps/pricing`: precios especiales por rango.
- `apps/reservations`: reservas y estados.
- `apps/payments`: comprobantes de pago.
- `apps/audit`: trazabilidad generica.

## Objetivo arquitectonico

El sistema debe crecer hacia una plataforma con dos superficies principales:

- experiencia cliente para consultar disponibilidad, solicitar reserva, subir comprobantes y seguir estados, sin exigir login en el primer contacto;
- experiencia administrativa para bloquear fechas, definir precios especiales, revisar solicitudes y operar pagos.

La arquitectura objetivo es modular por dominio, con limites claros entre:

- capacidades transversales;
- identidad y acceso;
- dominio de reservas;
- dominio comercial y operacional;
- interfaz publica;
- interfaz administrativa.

## Principios obligatorios

1. La logica de negocio no se concentra en vistas, componentes de pagina ni serializers.
2. Cada modulo funcional debe tener responsabilidad clara y limites de importacion simples.
3. El frontend no debe acoplarse a detalles internos del backend; solo a contratos HTTP estables.
4. `common`, `shared` y `design-system` existen para reutilizacion transversal, no para absorber cualquier codigo sin hogar.
5. Toda nueva capacidad debe declarar:
   - dueño funcional;
   - fronteras del modulo;
   - entradas y salidas;
   - dependencias permitidas.

## Crecimiento previsto del backend

Actualmente existen `common`, `users`, `properties`, `availability`, `reservations`, `pricing`, `payments` y `audit`. La evolucion sugerida del backend es continuar por dominio:

- `apps/notifications`: eventos de comunicacion hacia clientes y administradores.
- `apps/files`: metadatos y politicas de archivos cuando existan comprobantes y adjuntos reales.

## Crecimiento previsto del frontend

La estructura actual es intencionalmente pequeña. La evolucion sugerida es:

- mantener `app/` para bootstrap, providers, router y shells;
- mantener `shared/` solo para primitivas, utilidades, configuracion y UI agnostica al dominio;
- incorporar `modules/` o `features/` por dominio cuando aparezca funcionalidad real:
  - `availability`
  - `reservations`
  - `payments`
  - `admin`

La regla es simple: si un componente conoce reglas de negocio o datos de un dominio, no pertenece a `shared`.

## Riesgos que esta arquitectura busca evitar

- vistas del backend con logica de negocio incrustada;
- serializers convertidos en capa de dominio;
- componentes del frontend demasiado grandes y sin fronteras;
- reutilizacion caotica dentro de `common` o `shared`;
- crecimiento del producto alrededor de estados de reserva sin un modelo de dominio claro.
