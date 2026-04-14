# Estrategia de API

## Estado actual

La API ya tiene una estrategia inicial implementada:

- prefijo versionado: `/api/v1/`;
- autenticacion JWT;
- documentacion OpenAPI;
- Swagger UI;
- endpoint root para descubrir rutas base;
- healthcheck publico;
- flujo cliente publico basado en token por reserva para no exigir login en la primera interaccion.

Ademas, el backend ya cuenta con modelos listos para exponer dominios de:

- informacion publica de la parcela;
- disponibilidad;
- reservas;
- pricing;
- pagos;
- auditoria.

## Principios

1. Toda API nueva entra bajo `/api/v1/` mientras no exista una razon real para versionar a `/v2/`.
2. Los recursos deben crecer por dominio, no por pantallas del frontend.
3. La API debe expresar estados de negocio de forma explicita, especialmente en reservas y pagos.
4. Swagger debe mantenerse sincronizado con los endpoints reales.

## Convenciones sugeridas

### Seguridad

- endpoints publicos solo cuando la regla de negocio realmente lo permita;
- para operaciones publicas sensibles sobre una reserva concreta se usa `public_id` mas token de acceso por reserva;
- endpoints autenticados por defecto;
- permisos por rol cuando aparezcan vistas administrativas reales.

### URLs

Usar rutas orientadas a recursos y acciones claras. Ejemplos futuros:

- `/api/v1/availability/calendar/`
- `/api/v1/reservations/`
- `/api/v1/reservations/{id}/`
- `/api/v1/payments/{id}/receipt/`

### Serializacion

- serializers delgados;
- validacion de formato en serializer;
- validacion de reglas de negocio fuera de la capa HTTP cuando la complejidad crezca.

## Lo que ya existe

- `POST /api/v1/auth/token/`
- `POST /api/v1/auth/token/refresh/`
- `GET /api/v1/auth/me/`
- `GET /api/v1/public/property/`
- `GET /api/v1/public/availability/`
- `POST /api/v1/public/reservations/`
- `GET /api/v1/public/reservations/{public_id}/status/`
- `POST /api/v1/public/reservations/{public_id}/payment-receipts/`
- `POST /api/v1/client/reservations/`
- `GET /api/v1/client/reservations/{public_id}/status/`
- `POST /api/v1/client/reservations/{public_id}/payment-receipts/`
- `GET /api/v1/admin/reservations/`
- `GET /api/v1/admin/reservations/{public_id}/`
- `POST /api/v1/admin/reservations/{public_id}/approve/`
- `POST /api/v1/admin/reservations/{public_id}/reject/`
- `GET|POST|PATCH|DELETE /api/v1/admin/blocked-dates/`
- `GET|POST|PATCH|DELETE /api/v1/admin/special-prices/`

## Direccion futura

La API debe crecer por dominios funcionales ya modelados:

- informacion publica de la parcela;
- disponibilidad;
- reservas;
- pricing;
- pagos.

La administracion operativa debe montarse encima de esos dominios, no como un modulo paralelo con modelos propios duplicados.

La meta es que el frontend consuma contratos claros y estables, sin tener que conocer detalles internos de modelos o tablas.

En la etapa actual, el frontend cliente puede construirse directamente sobre el flujo publico:

- consultar disponibilidad;
- crear solicitud sin login;
- guardar `public_id` y `access_token` devueltos por la API;
- reutilizar ese token para consultar estado y subir comprobantes.

El flujo autenticado se mantiene en paralelo para escenarios futuros de cuenta cliente, sin obligar esa friccion en V1.
