"""
Booking endpoint and service tests.

Tests for booking creation, availability checking, merchant approval/rejection,
cancellation, and timeline functionality.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import date, time

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType, VenueService
from app.models.booking import Booking, BookingStatus
from app.services.pricing import PricingService
from app.services.booking import BookingService
from geoalchemy2 import func as geofunc


class TestBookingAvailability:
    """Test availability checking logic."""

    @pytest.mark.asyncio
    async def test_check_availability_no_conflicts(
        db_session: AsyncSession,
    ) -> None:
        """Test availability check with no existing bookings."""
        # Create venue
        merchant = User(
            phone="+84901234001",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Ba Dinh",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.02), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=150000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.commit()

        # Check availability
        service = BookingService(db_session)
        available = await service.check_availability(
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time="10:00",
            end_time="11:00",
        )

        assert available is True

    @pytest.mark.asyncio
    async def test_check_availability_with_conflict(
        db_session: AsyncSession,
    ) -> None:
        """Test availability check with existing booking."""
        # Create merchant and venue
        merchant = User(
            phone="+84901234002",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Cau Giay",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.80, 21.00), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=150000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        # Create existing booking
        booking = Booking(
            user_id=uuid4(),
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=150000,
            price_factor=1.0,
            service_fee=7500,
            total_price=157500,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Check same slot - should not be available
        service = BookingService(db_session)
        available = await service.check_availability(
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time="10:00",
            end_time="11:00",
        )

        assert available is False

    @pytest.mark.asyncio
    async def test_check_availability_different_slot(
        db_session: AsyncSession,
    ) -> None:
        """Test availability check for different time slot."""
        # Create merchant and venue
        merchant = User(
            phone="+84901234003",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Dong Da",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.82, 21.01), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=150000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        # Create booking for 10:00-11:00
        booking = Booking(
            user_id=uuid4(),
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=150000,
            price_factor=1.0,
            service_fee=7500,
            total_price=157500,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Check different slot 11:00-12:00 - should be available
        service = BookingService(db_session)
        available = await service.check_availability(
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time="11:00",
            end_time="12:00",
        )

        assert available is True


class TestBookingCreation:
    """Test booking creation and management."""

    @pytest.mark.asyncio
    async def test_create_booking_success(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test successful booking creation."""
        # Create user and merchant
        user = User(
            phone="+84901234004",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234005",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Hai Ba Trung",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.02), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=150000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234004", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        # Create booking
        response = await client.post(
            "/api/v1/bookings",
            json={
                "venue_id": str(venue.id),
                "booking_date": "2026-04-15",
                "start_time": "10:00",
                "end_time": "11:00",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == BookingStatus.PENDING.value
        assert data["venue_id"] == str(venue.id)

    @pytest.mark.asyncio
    async def test_create_booking_conflict(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test booking creation with time slot conflict."""
        # Create user and merchant
        user = User(
            phone="+84901234006",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234007",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Hoan Kiem",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.02), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=150000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        # Create first booking
        booking1 = Booking(
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=150000,
            price_factor=1.0,
            service_fee=7500,
            total_price=157500,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking1)
        await db_session.commit()

        # Login and try to create conflicting booking
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234006", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/api/v1/bookings",
            json={
                "venue_id": str(venue.id),
                "booking_date": "2026-04-15",
                "start_time": "10:00",
                "end_time": "11:00",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400  # Bad Request - slot not available

    @pytest.mark.asyncio
    async def test_get_user_bookings(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test getting user's booking list."""
        # Create user, merchant, and booking
        user = User(
            phone="+84901234008",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234009",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Tay Ho",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.83, 21.03), 4326),  # type: ignore
            venue_type=VenueType.TENNIS,
            base_price_per_hour=200000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        booking = Booking(
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=200000,
            price_factor=1.0,
            service_fee=10000,
            total_price=210000,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Login and get bookings
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234008", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/bookings",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1


class TestBookingCancellation:
    """Test booking cancellation."""

    @pytest.mark.asyncio
    async def test_user_cancel_pending_booking(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test user cancelling their pending booking."""
        # Create user, merchant, and booking
        user = User(
            phone="+84901234010",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234011",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Thanh Xuan",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.80, 21.02), 4326),  # type: ignore
            venue_type=VenueType.BADMINTON,
            base_price_per_hour=100000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        booking = Booking(
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=100000,
            price_factor=1.0,
            service_fee=5000,
            total_price=105000,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Login and cancel
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234010", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            f"/api/v1/bookings/{booking.id}/cancel",
            json={"reason": "Changed plans"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == BookingStatus.CANCELLED.value

    @pytest.mark.asyncio
    async def test_cancel_other_user_booking_forbidden(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test that users cannot cancel other users' bookings."""
        # Create two users and one booking
        user1 = User(
            phone="+84901234012",
            password_hash=hash_password("SecurePass123"),
            full_name="User 1",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user1)
        await db_session.flush()

        user2 = User(
            phone="+84901234013",
            password_hash=hash_password("SecurePass123"),
            full_name="User 2",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user2)
        await db_session.flush()

        merchant = User(
            phone="+84901234014",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Hoang Mai",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.00), 4326),  # type: ignore
            venue_type=VenueType.BASKETBALL,
            base_price_per_hour=180000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        booking = Booking(
            user_id=user1.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=180000,
            price_factor=1.0,
            service_fee=9000,
            total_price=189000,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Login as user2 and try to cancel user1's booking
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234013", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            f"/api/v1/bookings/{booking.id}/cancel",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404  # Not found (ownership check)


class TestMerchantApproval:
    """Test merchant booking approval and rejection."""

    @pytest.mark.asyncio
    async def test_merchant_approve_booking(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test merchant approving a booking."""
        # Create user, merchant, and paid booking
        user = User(
            phone="+84901234015",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234016",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Long Bien",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.88, 21.05), 4326),  # type: ignore
            venue_type=VenueType.VOLLEYBALL,
            base_price_per_hour=120000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        booking = Booking(
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=120000,
            price_factor=1.0,
            service_fee=6000,
            total_price=126000,
            status=BookingStatus.PENDING,
            paid_at=datetime.now(),  # Simulate payment
        )
        db_session.add(booking)
        await db_session.commit()

        # Login as merchant and approve
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234016", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            f"/api/v1/merchant/bookings/{booking.id}/approve",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == BookingStatus.CONFIRMED.value

    @pytest.mark.asyncio
    async def test_merchant_reject_booking(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test merchant rejecting a booking."""
        # Create user, merchant, and booking
        user = User(
            phone="+84901234017",
            password_hash=hash_password("SecurePass123"),
            full_name="User",
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.flush()

        merchant = User(
            phone="+84901234018",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Ha Dong",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.75, 21.00), 4326),  # type: ignore
            venue_type=VenueType.SWIMMING,
            base_price_per_hour=250000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.flush()

        booking = Booking(
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=250000,
            price_factor=1.0,
            service_fee=12500,
            total_price=262500,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Login as merchant and reject
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"phone": "+84901234018", "password": "SecurePass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            f"/api/v1/merchant/bookings/{booking.id}/reject",
            json={"reason": "Venue maintenance"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == BookingStatus.CANCELLED.value


class TestBookingTimeline:
    """Test availability timeline endpoint."""

    @pytest.mark.asyncio
    async def test_get_timeline(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test getting hourly availability timeline."""
        # Create merchant and venue
        merchant = User(
            phone="+84901234019",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Nam Tu Liem",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.75, 21.02), 4326),  # type: ignore
            venue_type=VenueType.TABLE_TENNIS,
            base_price_per_hour=80000,
            is_active=True,
            operating_hours={"open": "05:00", "close": "23:00"},
        )
        db_session.add(venue)
        await db_session.flush()

        # Create a booking for 10:00-11:00
        booking = Booking(
            user_id=uuid4(),
            venue_id=venue.id,
            booking_date=date(2026, 4, 15),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            base_price=80000,
            price_factor=1.0,
            service_fee=4000,
            total_price=84000,
            status=BookingStatus.PENDING,
        )
        db_session.add(booking)
        await db_session.commit()

        # Get timeline
        response = await client.get(
            f"/api/v1/bookings/venues/{venue.id}/timeline",
            params={"date": "2026-04-15"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["venue_id"] == str(venue.id)
        assert data["date"] == "2026-04-15"
        assert len(data["slots"]) > 0

        # Check that 10:00 slot is not available
        slot_10 = next((s for s in data["slots"] if s["hour"] == 10), None)
        assert slot_10 is not None
        assert slot_10["available"] is False

        # Check that 11:00 slot is available
        slot_11 = next((s for s in data["slots"] if s["hour"] == 11), None)
        assert slot_11 is not None
        assert slot_11["available"] is True


class TestPricePreview:
    """Test price preview endpoint."""

    @pytest.mark.asyncio
    async def test_price_preview_off_peak(
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Test price preview for off-peak weekday slot."""
        # Create merchant and venue
        merchant = User(
            phone="+84901234020",
            password_hash=hash_password("SecurePass123"),
            full_name="Merchant",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        db_session.add(merchant)
        await db_session.flush()

        venue = Venue(
            merchant_id=merchant.id,
            name="Test Venue",
            address="123 Test St",
            district="Bac Tu Liem",
            location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.78, 21.04), 4326),  # type: ignore
            venue_type=VenueType.FOOTBALL_7,
            base_price_per_hour=300000,
            is_active=True,
        )
        db_session.add(venue)
        await db_session.commit()

        # Get price preview for Wednesday 10:00-11:00 (off-peak)
        response = await client.post(
            "/api/v1/bookings/price-calculation",
            json={
                "venue_id": str(venue.id),
                "booking_date": "2026-04-09",  # Wednesday
                "start_time": "10:00",
                "end_time": "11:00",
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Check pricing: 300,000 × 1.0 = 300,000 + 5% fee = 315,000
        assert data["venue_pricing"]["base_price"] == 300000
        assert data["venue_pricing"]["price_factor"] == 1.0
        assert data["venue_pricing"]["subtotal"] == 300000
        assert data["total"] == 315000
