# app_web_parcela

Base inicial profesional para una plataforma web de gestion de reservas de una parcela recreativa.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Django + Django REST Framework
- Base de datos: PostgreSQL
- Auth: JWT
- Documentacion API: OpenAPI / Swagger

## Estructura del repositorio

```text
app_web_parcela/
├── apps/
│   ├── backend/
│   └── frontend/
├── docs/
│   ├── adr/
│   ├── backend/
│   └── frontend/
├── infra/
│   └── docker/
└── scripts/
```

## Que quedo inicializado

- Monorepo con separacion clara por frontend, backend, infraestructura y docs.
- Frontend React listo con Tailwind, tokens base y alias `@/*`.
- Backend Django modular con settings por entorno.
- Usuario propio autenticado por email.
- JWT y endpoint autenticado `GET /api/v1/auth/me/`.
- OpenAPI con Swagger UI.
- PostgreSQL listo para desarrollo local con Docker Compose.

## Preparacion del entorno en Windows PowerShell

1. Copia las variables base:

```powershell
Copy-Item .env.example .env
```

2. Levanta PostgreSQL:

```powershell
docker compose -f infra/docker/compose.yml up -d
```

3. Instala y activa el entorno virtual del backend si partes desde cero:

```powershell
cd apps/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements/base.txt
```

Si `python` no aparece en tu PowerShell actual despues de instalarlo, cierra y abre la terminal nuevamente.

4. Ejecuta migraciones y crea un superusuario:

```powershell
python manage.py migrate
python manage.py createsuperuser
```

5. Levanta el backend:

```powershell
python manage.py runserver
```

6. En otra consola, levanta el frontend:

```powershell
cd apps/frontend
cmd /c npm install
cmd /c npm run dev
```

La configuracion por defecto usa PostgreSQL en `localhost:5433` para evitar colision con instalaciones locales ya existentes en `5432`.

## URLs locales

- Frontend: `http://localhost:5173`
- Backend API root: `http://localhost:8000/api/v1/`
- Swagger: `http://localhost:8000/api/v1/docs/`
- Django admin: `http://localhost:8000/admin/`

## Endpoints disponibles en esta etapa

- `GET /api/v1/`
- `GET /api/v1/health/`
- `POST /api/v1/auth/token/`
- `POST /api/v1/auth/token/refresh/`
- `GET /api/v1/auth/me/`
- `GET /api/v1/schema/`
- `GET /api/v1/docs/`

## Siguiente fase recomendada

Modelar el dominio de reservas: calendarios de disponibilidad, bloqueos, precios especiales, solicitudes, comprobantes y flujo administrativo.
