# Roadmap tecnico-funcional

## Fase 0: base fundacional

Estado: completada.

- monorepo creado;
- frontend React + Vite + TypeScript inicializado;
- Tailwind y tokens base configurados;
- backend Django + DRF inicializado;
- JWT y Swagger configurados;
- PostgreSQL local documentado;
- ADRs iniciales definidos.

## Fase 1: dominio de reservas

Objetivo: dejar el primer flujo de negocio real.

- crear `availability` para fechas visibles y bloqueos;
- crear `reservations` para solicitudes y estados;
- crear `pricing` para tarifas especiales;
- exponer endpoints de consulta y operacion;
- agregar primeras pantallas cliente y admin.

## Fase 2: comprobantes y operacion administrativa

Objetivo: controlar mejor el ciclo comercial.

- crear `payments` y/o `files`;
- permitir subir y listar comprobantes;
- agregar validacion operativa por administrador;
- registrar observaciones y trazabilidad de cambios de estado.

## Fase 3: experiencia y robustez

Objetivo: endurecer la plataforma para uso sostenido.

- permisos mas finos por rol;
- tests por dominio;
- validaciones de API consistentes;
- auditoria de acciones relevantes;
- mejora de UX en frontend por modulo.

## Fase 4: extensiones de producto

Objetivo: abrir nuevas capacidades sin rehacer la base.

- notificaciones;
- reportes operativos;
- automatizaciones;
- nuevas reglas comerciales.
