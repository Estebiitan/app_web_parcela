# Alcance V1

## Objetivo de la primera version usable

La V1 debe permitir operar reservas de forma ordenada, con visibilidad minima para cliente y control real para administracion.

## Alcance funcional objetivo

### Cliente

- consultar disponibilidad de fechas publicas;
- enviar solicitud de reserva sin login obligatorio;
- ver el estado de su solicitud con token de seguimiento o desde una cuenta autenticada;
- subir comprobante de pago asociado a su solicitud con token de seguimiento o desde una cuenta autenticada;
- recibir claridad sobre aprobacion, observacion o rechazo.

### Administrador

- bloquear fechas no disponibles;
- aprobar, observar o rechazar solicitudes;
- registrar precios especiales por rango de fechas;
- revisar comprobantes de pago;
- consultar historial basico por reserva.

## Lo que existe hoy

La base ya cubre una primera capa funcional de API para la V1:

- usuario autenticado por email;
- JWT;
- API versionada;
- Swagger;
- frontend preparado para consumir la API;
- endpoint publico para informacion de la parcela;
- endpoint publico de disponibilidad;
- flujo publico de solicitud de reserva con token por reserva;
- flujo publico de consulta de estado y subida de comprobante con token por reserva;
- flujo autenticado equivalente para clientes que operen con cuenta;
- modelo de reservas con estados e historial;
- bloqueos de fechas;
- precios especiales por rango;
- comprobantes de pago;
- auditoria generica;
- base de datos PostgreSQL configurada para desarrollo.

## Lo que explicitamente queda fuera de esta V1

- pagos online automaticos;
- integraciones con pasarelas externas;
- multi-parcela;
- paneles analiticos avanzados;
- automatizaciones complejas de mensajeria;
- pricing dinamico sofisticado.

## Dependencias tecnicas para alcanzar V1

- exponer via DRF los dominios `availability`, `reservations`, `pricing` y `payments`;
- implementar servicios transaccionales de disponibilidad y cambio de estado;
- agregar router y pantallas por rol en frontend;
- agregar permisos por rol y reglas de negocio operativas.
