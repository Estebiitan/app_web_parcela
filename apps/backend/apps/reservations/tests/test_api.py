from datetime import date
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.availability.models import BlockedDate
from apps.properties.models import PropertyInfo
from apps.reservations.models import Reservation, ReservationGuestAccess, ReservationStatus
from apps.users.models import User


class ReservationApiTests(TestCase):
    def setUp(self):
        self.client_api = APIClient()
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='super-secret-123',
            role=User.Role.CLIENT,
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='super-secret-123',
            role=User.Role.ADMIN,
            is_staff=True,
        )
        PropertyInfo.objects.create(
            name='Parcela Los Aromos',
            short_description='Parcela recreativa para eventos familiares.',
            max_guest_count=20,
            base_daily_price=Decimal('85000.00'),
            currency='CLP',
            is_active=True,
        )

    def test_public_availability_marks_blocked_date_as_unavailable(self):
        BlockedDate.objects.create(
            title='Mantenimiento',
            start_date=date(2026, 5, 10),
            end_date=date(2026, 5, 10),
            is_active=True,
        )

        response = self.client_api.get(
            '/api/v1/public/availability/',
            {'start_date': '2026-05-10', 'end_date': '2026-05-10'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_available'])
        self.assertEqual(len(response.data['conflicts']), 1)

    def test_client_can_create_reservation_request(self):
        self.client_api.force_authenticate(self.client_user)

        response = self.client_api.post(
            '/api/v1/client/reservations/',
            {
                'start_date': '2026-05-15',
                'end_date': '2026-05-16',
                'guest_count': 6,
                'customer_message': 'Cumpleanos familiar.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        reservation = Reservation.objects.get(public_id=response.data['public_id'])
        self.assertEqual(reservation.status, ReservationStatus.PENDING)
        self.assertEqual(reservation.status_history.count(), 1)
        self.assertEqual(reservation.quoted_total_amount, Decimal('170000.00'))

    def test_guest_can_create_reservation_request_without_login(self):
        response = self.client_api.post(
            '/api/v1/public/reservations/',
            {
                'contact_name': 'Claudia Soto',
                'contact_email': 'claudia@example.com',
                'contact_phone': '+56911112222',
                'start_date': '2026-05-18',
                'end_date': '2026-05-18',
                'guest_count': 5,
                'customer_message': 'Asado familiar.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertIn('access_token', response.data['guest_access'])
        reservation = Reservation.objects.get(public_id=response.data['reservation']['public_id'])
        self.assertEqual(reservation.customer.email, 'claudia@example.com')
        self.assertTrue(hasattr(reservation, 'guest_access'))

    def test_guest_can_check_status_with_access_token(self):
        reservation = Reservation.objects.create(
            customer=self.client_user,
            start_date=date(2026, 5, 28),
            end_date=date(2026, 5, 28),
            guest_count=3,
            status=ReservationStatus.PENDING,
            quoted_total_amount=Decimal('85000.00'),
            currency='CLP',
        )
        guest_access = ReservationGuestAccess(
            reservation=reservation,
            contact_email='client@example.com',
            contact_name='Cliente Demo',
        )
        guest_access.set_access_token('guest-status-token')
        guest_access.save()

        response = self.client_api.get(
            f'/api/v1/public/reservations/{reservation.public_id}/status/',
            HTTP_X_RESERVATION_ACCESS_TOKEN='guest-status-token',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['public_id'], str(reservation.public_id))

    def test_client_can_upload_payment_receipt_and_transition_status(self):
        reservation = Reservation.objects.create(
            customer=self.client_user,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 1),
            guest_count=8,
            status=ReservationStatus.AWAITING_PAYMENT,
            quoted_total_amount=Decimal('85000.00'),
            currency='CLP',
        )

        self.client_api.force_authenticate(self.client_user)
        response = self.client_api.post(
            f'/api/v1/client/reservations/{reservation.public_id}/payment-receipts/',
            {
                'file': SimpleUploadedFile('receipt.txt', b'payment-proof', content_type='text/plain'),
                'amount': '85000.00',
                'payment_date': '2026-05-20',
                'reference_number': 'TX-12345',
            },
        )

        reservation.refresh_from_db()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(reservation.status, ReservationStatus.PAYMENT_SUBMITTED)

    def test_guest_can_upload_payment_receipt_with_access_token(self):
        reservation = Reservation.objects.create(
            customer=self.client_user,
            start_date=date(2026, 6, 4),
            end_date=date(2026, 6, 4),
            guest_count=5,
            status=ReservationStatus.AWAITING_PAYMENT,
            quoted_total_amount=Decimal('85000.00'),
            currency='CLP',
        )
        guest_access = ReservationGuestAccess(
            reservation=reservation,
            contact_email='client@example.com',
            contact_name='Cliente Demo',
        )
        guest_access.set_access_token('guest-payment-token')
        guest_access.save()

        response = self.client_api.post(
            f'/api/v1/public/reservations/{reservation.public_id}/payment-receipts/',
            {
                'file': SimpleUploadedFile('receipt.txt', b'payment-proof', content_type='text/plain'),
                'amount': '85000.00',
                'payment_date': '2026-05-22',
                'reference_number': 'TX-67890',
            },
            HTTP_X_RESERVATION_ACCESS_TOKEN='guest-payment-token',
        )

        reservation.refresh_from_db()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(reservation.status, ReservationStatus.PAYMENT_SUBMITTED)

    def test_admin_can_approve_payment_submitted_reservation(self):
        reservation = Reservation.objects.create(
            customer=self.client_user,
            start_date=date(2026, 6, 2),
            end_date=date(2026, 6, 2),
            guest_count=4,
            status=ReservationStatus.PAYMENT_SUBMITTED,
            quoted_total_amount=Decimal('85000.00'),
            currency='CLP',
        )

        self.client_api.force_authenticate(self.admin_user)
        response = self.client_api.post(
            f'/api/v1/admin/reservations/{reservation.public_id}/approve/',
            {'comment': 'Pago validado correctamente.'},
            format='json',
        )

        reservation.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(reservation.status, ReservationStatus.CONFIRMED)
