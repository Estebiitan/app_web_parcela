import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0002_alter_reservation_status_updated_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReservationGuestAccess',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('public_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('contact_email', models.EmailField(max_length=254)),
                ('contact_name', models.CharField(blank=True, max_length=150)),
                ('contact_phone', models.CharField(blank=True, max_length=30)),
                ('access_token_hash', models.CharField(max_length=64, unique=True)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                (
                    'reservation',
                    models.OneToOneField(
                        on_delete=models.deletion.CASCADE,
                        related_name='guest_access',
                        to='reservations.reservation',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Reservation guest access',
                'verbose_name_plural': 'Reservation guest access',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddIndex(
            model_name='reservationguestaccess',
            index=models.Index(
                fields=['contact_email', 'created_at'],
                name='reservation_contact_4f8d36_idx',
            ),
        ),
    ]
