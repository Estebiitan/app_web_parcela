from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        CLIENT = 'client', 'Cliente'

    username = None
    email = models.EmailField('email address', unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
    phone = models.CharField(max_length=30, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
