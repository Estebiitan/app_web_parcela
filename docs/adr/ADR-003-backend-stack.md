# ADR-003: Backend con Django, DRF, JWT y OpenAPI

## Estado
Aprobada

## Contexto

El backend debe exponer una API administrativa y transaccional, con autenticacion, panel de administracion y capacidad de crecer por dominios sin introducir mucha infraestructura desde el primer dia.

## Decision

Usar:

- Django 6
- Django REST Framework
- `djangorestframework-simplejwt`
- `drf-spectacular`
- modelo de usuario propio autenticado por email

## Consecuencias

- Django aporta admin, ORM y estructura madura;
- DRF ofrece una base clara para la API;
- JWT permite desacoplar autenticacion del frontend web;
- OpenAPI deja la API visible y verificable;
- el usuario custom evita una migracion delicada mas adelante.
