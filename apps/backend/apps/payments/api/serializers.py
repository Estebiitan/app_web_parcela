from rest_framework import serializers

from apps.payments.models import PaymentReceipt


class PaymentReceiptCreateSerializer(serializers.Serializer):
    file = serializers.FileField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    payment_date = serializers.DateField(required=False, allow_null=True)
    reference_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PaymentReceiptDetailSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)

    class Meta:
        model = PaymentReceipt
        fields = (
            'public_id',
            'amount',
            'currency',
            'payment_date',
            'reference_number',
            'notes',
            'review_status',
            'review_notes',
            'uploaded_by_email',
            'reviewed_at',
            'created_at',
        )

