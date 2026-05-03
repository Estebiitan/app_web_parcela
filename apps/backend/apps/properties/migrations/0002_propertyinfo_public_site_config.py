from django.db import migrations, models

import apps.properties.defaults


class Migration(migrations.Migration):
    dependencies = [
        ('properties', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyinfo',
            name='experience_cards',
            field=models.JSONField(blank=True, default=apps.properties.defaults.default_experience_cards),
        ),
        migrations.AddField(
            model_name='propertyinfo',
            name='gallery_images',
            field=models.JSONField(blank=True, default=apps.properties.defaults.default_gallery_images),
        ),
        migrations.AddField(
            model_name='propertyinfo',
            name='hero_gallery_image_ids',
            field=models.JSONField(
                blank=True,
                default=apps.properties.defaults.default_hero_gallery_image_ids,
            ),
        ),
        migrations.AddField(
            model_name='propertyinfo',
            name='pricing_rules',
            field=models.JSONField(blank=True, default=apps.properties.defaults.default_pricing_rules),
        ),
    ]
