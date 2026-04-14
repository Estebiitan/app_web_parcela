from datetime import timedelta
from pathlib import Path

import environ

ROOT_DIR = Path(__file__).resolve().parents[4]
BACKEND_DIR = Path(__file__).resolve().parents[2]

env = environ.Env(DJANGO_DEBUG=(bool, False))
environ.Env.read_env(ROOT_DIR / '.env')

SECRET_KEY = env(
    'DJANGO_SECRET_KEY',
    default='change-me-before-shared-development',
)
DEBUG = env.bool('DJANGO_DEBUG', default=False)
ENVIRONMENT = env('DJANGO_ENVIRONMENT', default='development')
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'corsheaders',
    'rest_framework',
    'drf_spectacular',
    'apps.common',
    'apps.users',
    'apps.properties',
    'apps.availability',
    'apps.pricing',
    'apps.reservations',
    'apps.payments',
    'apps.audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default='postgresql://parcela_app:parcela_app_dev@localhost:5433/parcela',
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BACKEND_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BACKEND_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'app_web_parcela API',
    'DESCRIPTION': 'API base para la gestion de reservas de la parcela recreativa.',
    'VERSION': '0.1.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

CORS_ALLOWED_ORIGINS = env.list(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173'],
)
CSRF_TRUSTED_ORIGINS = env.list(
    'DJANGO_CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173'],
)
CORS_ALLOW_CREDENTIALS = True
