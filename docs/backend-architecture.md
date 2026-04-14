# Arquitectura backend

## Estado actual

El backend esta montado sobre Django 6 y DRF con una estructura pequena pero correcta para crecer:

- `config/settings/base.py`: configuracion compartida;
- `config/settings/development.py`: entorno local;
- `config/settings/production.py`: endurecimiento inicial para produccion;
- `config/api/urls.py`: entrada de la API versionada;
- `apps/common`: endpoints transversales;
- `apps/users`: usuario, admin y autenticacion relacionada.
- `apps/properties`: informacion publica y comercial de la parcela;
- `apps/availability`: bloqueos de fechas;
- `apps/pricing`: precios especiales por rango;
- `apps/reservations`: reserva, estado actual e historial;
- `apps/payments`: comprobantes de pago;
- `apps/audit`: trazabilidad generica por entidad.

## Responsabilidades actuales

### `apps.common`

Responsabilidad: capacidades transversales y de bajo acoplamiento.

Hoy contiene:

- root de API;
- healthcheck.

No debe absorber logica de reservas, pagos ni pricing.

### `apps.users`

Responsabilidad: identidad y datos base del actor autenticado.

Hoy contiene:

- modelo `User` custom;
- `UserManager`;
- configuracion de admin;
- endpoint `auth/me`;
- integracion con JWT.

### `apps.properties`

Responsabilidad: fuente de verdad del perfil publico activo de la parcela.

Hoy contiene:

- `PropertyInfo`;
- tarifa base diaria;
- capacidad maxima;
- datos publicos de contacto y operacion.

### `apps.availability`

Responsabilidad: indisponibilidad operativa de la parcela.

Hoy contiene:

- `BlockedDate`;
- tipos de bloqueo;
- consulta base para rangos activos y solapados.

### `apps.pricing`

Responsabilidad: reglas operativas de precio por fecha.

Hoy contiene:

- `SpecialDatePrice`;
- precio diario especial por rango;
- constraint para evitar rangos activos solapados.

### `apps.reservations`

Responsabilidad: agregado principal del negocio.

Hoy contiene:

- `Reservation`;
- `ReservationStatusHistory`;
- `ReservationGuestAccess`;
- estados de reserva y transiciones base;
- timestamp dedicado para ultima actualizacion de estado;
- constraint para evitar sobre-reservas activas por solape de fechas;
- servicios para crear reservas autenticadas y publicas;
- validacion de acceso invitado por token de reserva.

### `apps.payments`

Responsabilidad: comprobantes declarados por el cliente y su revision.

Hoy contiene:

- `PaymentReceipt`;
- archivo adjunto;
- metadata declarada;
- estado de revision administrativa;
- consistencia obligatoria entre `review_status`, `reviewed_by` y `reviewed_at`.

### `apps.audit`

Responsabilidad: auditoria generica y desacoplada del dominio puntual.

Hoy contiene:

- `AuditLog`;
- actor, accion, resumen y cambios en JSON;
- asociacion generica con cualquier entidad del sistema.

## Reglas de crecimiento por modulo

1. Cada dominio nuevo debe vivir en una app propia dentro de `apps/`.
2. Una app puede exponer:
   - `models.py`
   - `api/`
   - `services.py` o `domain/` cuando la logica lo requiera
   - `selectors.py` si aparecen consultas complejas
3. Las vistas DRF coordinan peticiones; no concentran reglas de negocio.
4. Los serializers validan y transforman datos; no orquestan procesos completos.
5. `common` no se usa como comodin para cualquier utilidad sin clasificacion.

## Siguientes apps probables

### `apps/notifications`

- eventos disparadores;
- construccion de mensajes;
- futuros canales externos.

### `apps/files`

- politicas de almacenamiento;
- metadatos de adjuntos;
- futura unificacion de archivos si el dominio crece mas alla de comprobantes.

## Dependencias permitidas

- `reservations` puede depender de `users`, `availability` y `pricing`.
- `payments` puede depender de `reservations`.
- `audit` puede referenciar cualquier entidad, pero no debe contener reglas de negocio.
- `notifications` puede depender de eventos de otros dominios, pero no controlar su logica interna.
- `common` no depende de dominios de negocio.

## Contratos actuales de API

Hoy el backend expone:

- `GET /api/v1/`
- `GET /api/v1/health/`
- `POST /api/v1/auth/token/`
- `POST /api/v1/auth/token/refresh/`
- `GET /api/v1/auth/me/`
- `GET /api/v1/schema/`
- `GET /api/v1/docs/`

La primera capa funcional de API ya expone superficies `public`, `client` y `admin`, manteniendo servicios y serializers separados por dominio.
En particular, el flujo cliente de V1 puede operar sin login mediante endpoints publicos de reserva con token por reserva, mientras el flujo autenticado queda disponible para una evolucion posterior de cuenta cliente.
Los siguientes crecimientos deberian profundizar permisos, servicios transaccionales y operaciones administrativas mas finas, sin romper los limites por modulo.

## Decision importante ya tomada

El usuario propio existe desde el inicio. Eso evita una migracion tardia cuando el producto necesite diferenciar claramente clientes y administradores.
