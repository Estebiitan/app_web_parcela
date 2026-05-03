from django.db import migrations, models

import apps.properties.defaults


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0002_propertyinfo_public_site_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyinfo',
            name='location_map',
            field=models.JSONField(
                blank=True,
                default=apps.properties.defaults.default_location_map,
            ),
        ),
    ]
