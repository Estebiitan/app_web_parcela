# Vision de producto

## Problema que resuelve

La administracion de una parcela recreativa suele mezclar conversaciones por mensajeria, comprobantes enviados sin trazabilidad, disponibilidad poco confiable y decisiones manuales sin registro.

`app_web_parcela` busca convertir ese proceso en un flujo claro y auditable:

- el cliente consulta disponibilidad;
- registra una solicitud de reserva sin friccion innecesaria;
- adjunta comprobantes;
- sigue el estado de su reserva;
- el administrador opera fechas, bloqueos, precios y validaciones desde una misma plataforma.

## Usuarios objetivo

### Cliente

Necesita saber si una fecha esta disponible, registrar su interes y entender si su reserva fue aceptada, observada o rechazada, idealmente sin depender de crear una cuenta antes del primer contacto.

### Administrador

Necesita controlar disponibilidad real, evitar sobreventa, revisar comprobantes, aplicar precios especiales y dejar trazabilidad de las decisiones.

## Resultado esperado

El producto debe reducir tres fricciones operativas:

- incertidumbre sobre fechas disponibles;
- desorden en solicitudes y pagos;
- dependencia de conversaciones manuales para entender el estado de una reserva.

## Lo que hoy ya sostiene esa vision

La base actual ya responde a la direccion del producto:

- frontend preparado para integrarse con una API versionada;
- backend listo para JWT, usuario propio y documentacion OpenAPI;
- flujo publico de reserva, consulta de estado y carga de comprobante mediante token por reserva;
- infraestructura local con PostgreSQL;
- decisiones iniciales que priorizan modularidad y crecimiento por dominios.

## Criterios para aceptar nuevas funcionalidades

Una funcionalidad nueva deberia entrar al roadmap si cumple al menos una de estas condiciones:

- mejora la confiabilidad del calendario o del estado de reserva;
- reduce trabajo manual del administrador;
- mejora la trazabilidad de pagos y decisiones;
- agrega claridad al cliente en su flujo de reserva.
