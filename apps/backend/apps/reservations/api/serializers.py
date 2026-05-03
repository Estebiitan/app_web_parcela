from rest_framework import serializers

from apps.payments.models import PaymentReceipt
from apps.reservations.models import Reservation, ReservationStatusHistory
from apps.users.api.serializers import CurrentUserSerializer


class AvailabilityQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, attrs):
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'End date must be on or after start date.'})
        return attrs


class AvailabilityConflictSerializer(serializers.Serializer):
    source = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    block_type = serializers.CharField(required=False)


class QuoteSerializer(serializers.Serializer):
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()


class AvailabilityResponseSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    is_available = serializers.BooleanField()
    conflicts = AvailabilityConflictSerializer(many=True)
    quote = QuoteSerializer(allow_null=True)


class ReservationCreateSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    guest_count = serializers.IntegerField(min_value=1)
    customer_message = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'End date must be on or after start date.'})
        return attrs


class GuestReservationCreateSerializer(ReservationCreateSerializer):
    contact_name = serializers.CharField(max_length=150)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=30, required=False, allow_blank=True)


class ReservationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True)

    class Meta:
        model = ReservationStatusHistory
        fields = (
            'public_id',
            'from_status',
            'to_status',
            'comment',
            'changed_by_email',
            'created_at',
        )


class PaymentReceiptSummarySerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)

    class Meta:
        model = PaymentReceipt
        fields = (
            'public_id',
            'file_url',
            'amount',
            'currency',
            'payment_date',
            'reference_number',
            'review_status',
            'uploaded_by_email',
            'created_at',
        )

    def get_file_url(self, obj):
        if not obj.file:
            return ''

        request = self.context.get('request')
        file_url = obj.file.url
        if request:
            return request.build_absolute_uri(file_url)
        return file_url


class ReservationStatusSerializer(serializers.ModelSerializer):
    status_history = ReservationStatusHistorySerializer(many=True, read_only=True)
    payment_receipts = PaymentReceiptSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Reservation
        fields = (
            'public_id',
            'start_date',
            'end_date',
            'guest_count',
            'status',
            'status_reason',
            'quoted_total_amount',
            'currency',
            'customer_message',
            'expires_at',
            'status_updated_at',
            'created_at',
            'status_history',
            'payment_receipts',
        )


class GuestReservationAccessSerializer(serializers.Serializer):
    reservation_public_id = serializers.UUIDField()
    access_token = serializers.CharField()
    contact_email = serializers.EmailField()
    contact_name = serializers.CharField(allow_blank=True)
    contact_phone = serializers.CharField(allow_blank=True)


class GuestReservationCreateResponseSerializer(serializers.Serializer):
    reservation = ReservationStatusSerializer()
    guest_access = GuestReservationAccessSerializer()


class AdminReservationListSerializer(serializers.ModelSerializer):
    customer = CurrentUserSerializer(read_only=True)
    latest_payment_receipt = serializers.SerializerMethodField()
    latest_payment_receipt_status = serializers.SerializerMethodField()
    payment_receipts_count = serializers.SerializerMethodField()
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Reservation
        fields = (
            'public_id',
            'customer',
            'start_date',
            'end_date',
            'guest_count',
            'status',
            'status_label',
            'quoted_total_amount',
            'currency',
            'customer_message',
            'expires_at',
            'status_updated_at',
            'created_at',
            'payment_receipts_count',
            'latest_payment_receipt_status',
            'latest_payment_receipt',
        )

    def get_payment_receipts_count(self, obj):
        return obj.payment_receipts.count()

    def get_latest_payment_receipt_status(self, obj):
        receipt = obj.payment_receipts.first()
        return receipt.review_status if receipt else ''

    def get_latest_payment_receipt(self, obj):
        receipt = obj.payment_receipts.first()
        if not receipt:
            return None
        return PaymentReceiptSummarySerializer(receipt, context=self.context).data


class AdminReservationDetailSerializer(serializers.ModelSerializer):
    customer = CurrentUserSerializer(read_only=True)
    guest_contact_email = serializers.EmailField(source='guest_access.contact_email', read_only=True)
    guest_contact_name = serializers.CharField(source='guest_access.contact_name', read_only=True)
    guest_contact_phone = serializers.CharField(source='guest_access.contact_phone', read_only=True)
    status_history = ReservationStatusHistorySerializer(many=True, read_only=True)
    payment_receipts = PaymentReceiptSummarySerializer(many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Reservation
        fields = (
            'public_id',
            'customer',
            'start_date',
            'end_date',
            'guest_count',
            'status',
            'status_label',
            'quoted_total_amount',
            'currency',
            'customer_message',
            'guest_contact_email',
            'guest_contact_name',
            'guest_contact_phone',
            'internal_notes',
            'status_reason',
            'expires_at',
            'status_updated_at',
            'created_at',
            'updated_at',
            'status_history',
            'payment_receipts',
        )


class ReservationApprovalSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)


class ReservationRejectionSerializer(serializers.Serializer):
    reason = serializers.CharField()
    comment = serializers.CharField(required=False, allow_blank=True)
