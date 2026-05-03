from rest_framework import serializers

from apps.properties.models import PropertyInfo


class PricingBaseScheduleSerializer(serializers.Serializer):
    start = serializers.RegexField(r'^\d{2}:\d{2}$')
    end = serializers.RegexField(r'^\d{2}:\d{2}$')


class PricingRulesSerializer(serializers.Serializer):
    currency = serializers.CharField(max_length=3)
    minimumGuestCount = serializers.IntegerField(min_value=1)
    visibleMaximumGuestCount = serializers.IntegerField(min_value=1)
    firstTierMaximumGuestCount = serializers.IntegerField(min_value=1)
    secondTierMaximumGuestCount = serializers.IntegerField(min_value=1)
    firstTierBasePrice = serializers.IntegerField(min_value=1)
    secondTierBasePrice = serializers.IntegerField(min_value=1)
    extraGuestPrice = serializers.IntegerField(min_value=0)
    baseSchedule = PricingBaseScheduleSerializer()
    additionalHourPrice = serializers.IntegerField(min_value=0)
    maximumAdditionalHours = serializers.IntegerField(min_value=0)
    depositRate = serializers.FloatField(min_value=0, max_value=1)
    simulatorMicrocopy = serializers.CharField(allow_blank=True)

    def validate(self, attrs):
        if attrs['visibleMaximumGuestCount'] < attrs['minimumGuestCount']:
            raise serializers.ValidationError(
                {'visibleMaximumGuestCount': 'Debe ser mayor o igual al minimo comercial.'}
            )
        if attrs['firstTierMaximumGuestCount'] < attrs['minimumGuestCount']:
            raise serializers.ValidationError(
                {'firstTierMaximumGuestCount': 'Debe ser mayor o igual al minimo comercial.'}
            )
        if attrs['secondTierMaximumGuestCount'] < attrs['firstTierMaximumGuestCount']:
            raise serializers.ValidationError(
                {
                    'secondTierMaximumGuestCount': (
                        'Debe ser mayor o igual al maximo del primer tramo.'
                    )
                }
            )
        return attrs


class ExperienceCardSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120)
    description = serializers.CharField()
    icon = serializers.CharField(max_length=40)


class GalleryImageSerializer(serializers.Serializer):
    id = serializers.SlugField(max_length=80)
    src = serializers.CharField()
    alt = serializers.CharField()
    label = serializers.CharField(max_length=120)
    caption = serializers.CharField()
    area = serializers.CharField(max_length=120)
    objectPosition = serializers.CharField(required=False, allow_blank=True)
    orientation = serializers.ChoiceField(choices=('landscape', 'square'))


class MapVenueSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, allow_blank=True)
    address = serializers.CharField(allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    mapImageUrl = serializers.CharField(required=False, allow_blank=True)
    mapNotes = serializers.CharField(required=False, allow_blank=True)


class MapPointSerializer(serializers.Serializer):
    id = serializers.SlugField(max_length=80)
    label = serializers.CharField(max_length=120)
    category = serializers.CharField(max_length=60)
    description = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    x = serializers.FloatField(min_value=0, max_value=100)
    y = serializers.FloatField(min_value=0, max_value=100)
    url = serializers.CharField(required=False, allow_blank=True)
    isActive = serializers.BooleanField(default=True)


class LocationMapSerializer(serializers.Serializer):
    venue = MapVenueSerializer()
    points = MapPointSerializer(many=True)

    def validate(self, attrs):
        point_ids = [point['id'] for point in attrs.get('points', [])]
        if len(point_ids) != len(set(point_ids)):
            raise serializers.ValidationError({'points': 'Cada punto debe tener un id unico.'})
        return attrs


class PublicPropertyInfoSerializer(serializers.ModelSerializer):
    pricing_rules = PricingRulesSerializer()
    experience_cards = ExperienceCardSerializer(many=True)
    gallery_images = GalleryImageSerializer(many=True)
    hero_gallery_image_ids = serializers.ListField(child=serializers.CharField(max_length=80))
    location_map = LocationMapSerializer()

    class Meta:
        model = PropertyInfo
        fields = (
            'public_id',
            'name',
            'short_description',
            'location_name',
            'address',
            'max_guest_count',
            'base_daily_price',
            'currency',
            'check_in_time',
            'check_out_time',
            'contact_email',
            'contact_phone',
            'amenities',
            'pricing_rules',
            'experience_cards',
            'gallery_images',
            'hero_gallery_image_ids',
            'location_map',
        )


class AdminPropertyInfoSerializer(PublicPropertyInfoSerializer):
    is_active = serializers.BooleanField(required=False)

    class Meta(PublicPropertyInfoSerializer.Meta):
        fields = PublicPropertyInfoSerializer.Meta.fields + ('is_active',)

    def validate(self, attrs):
        gallery_images = attrs.get('gallery_images')
        hero_gallery_image_ids = attrs.get('hero_gallery_image_ids')

        if self.instance:
            if gallery_images is None:
                gallery_images = self.instance.gallery_images
            if hero_gallery_image_ids is None:
                hero_gallery_image_ids = self.instance.hero_gallery_image_ids

        if gallery_images is not None:
            gallery_ids = [image['id'] for image in gallery_images]
            if len(gallery_ids) != len(set(gallery_ids)):
                raise serializers.ValidationError(
                    {'gallery_images': 'Cada imagen debe tener un id unico.'}
                )
            if hero_gallery_image_ids is not None:
                missing_ids = [image_id for image_id in hero_gallery_image_ids if image_id not in gallery_ids]
                if missing_ids:
                    raise serializers.ValidationError(
                        {
                            'hero_gallery_image_ids': (
                                'Todas las imagenes destacadas deben existir en la galeria.'
                            )
                        }
                    )

        return attrs
