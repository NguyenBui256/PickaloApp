"""
Venue endpoint tests.

Tests for venue CRUD, search, availability, and management endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType, DayType, VenueService, PricingTimeSlot
from sqlalchemy import func


@pytest.mark.asyncio
async def test_list_venues_empty(client: AsyncClient) -> None:
    """Test listing venues when database is empty."""
    response = await client.get("/api/v1/venues")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_venues_with_filters(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test listing venues with district and venue_type filters."""
    # Create merchant
    merchant = User(
        phone="+84901234567",
        password_hash=hash_password("SecurePass123"),
        full_name="Venue Owner",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    # Create test venue
    venue = Venue(
        merchant_id=merchant.id,
        name="Test Football Field",
        address="123 Test Street",
        district="Ba Dinh",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.02), 4326),  # type: ignore
        venue_type=VenueType.FOOTBALL_5,
        description="A great football field",
        base_price_per_hour=150000,
        is_active=True,
        is_verified=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Test listing all venues
    response = await client.get("/api/v1/venues")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Test Football Field"

    # Test filtering by district
    response = await client.get("/api/v1/venues?district=Ba Dinh")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1

    # Test filtering by venue type
    response = await client.get(f"/api/v1/venues?venue_type={VenueType.FOOTBALL_5.value}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_get_venue_by_id(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test getting venue details by ID."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234568",
        password_hash=hash_password("SecurePass123"),
        full_name="Venue Owner",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    venue = Venue(
        merchant_id=merchant.id,
        name="Tennis Court",
        address="456 Tennis Ave",
        district="Cau Giay",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.80, 21.00), 4326),  # type: ignore
        venue_type=VenueType.TENNIS,
        base_price_per_hour=200000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Get venue
    response = await client.get(f"/api/v1/venues/{venue.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(venue.id)
    assert data["name"] == "Tennis Court"
    assert data["venue_type"] == VenueType.TENNIS.value


@pytest.mark.asyncio
async def test_get_venue_not_found(client: AsyncClient) -> None:
    """Test getting non-existent venue."""
    fake_id = uuid4()
    response = await client.get(f"/api/v1/venues/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_search_venues_nearby(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test geospatial search for venues."""
    # Create merchant
    merchant = User(
        phone="+84901234569",
        password_hash=hash_password("SecurePass123"),
        full_name="Venue Owner",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(merchant)
    await db_session.flush()

    # Create venue near Hoan Kiem Lake (21.0285, 105.8542)
    venue = Venue(
        merchant_id=merchant.id,
        name="Badminton Court",
        address="789 Badminton St",
        district="Hoan Kiem",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.8542, 21.0285), 4326),  # type: ignore
        venue_type=VenueType.BADMINTON,
        base_price_per_hour=100000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Search near Hoan Kiem Lake
    response = await client.get(
        "/api/v1/venues/search/nearby",
        params={"lat": 21.0285, "lng": 105.8542, "radius": 1000},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Badminton Court"


@pytest.mark.asyncio
async def test_create_venue_as_merchant(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test venue creation by merchant."""
    # Create merchant
    merchant = User(
        phone="+84901234570",
        password_hash=hash_password("SecurePass123"),
        full_name="New Merchant",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(merchant)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234570",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Create venue
    response = await client.post(
        "/api/v1/venues/merchant",
        json={
            "name": "Basketball Court",
            "address": "321 Basketball Rd",
            "district": "Hai Ba Trung",
            "coordinates": {"lat": 21.00, "lng": 105.85},
            "venue_type": VenueType.BASKETBALL.value,
            "base_price_per_hour": 180000,
            "description": "Indoor basketball court",
            "operating_hours": {"open": "06:00", "close": "22:00"},
            "amenities": ["parking", "showers", "lights"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Basketball Court"
    assert data["merchant_id"] == str(merchant.id)


@pytest.mark.asyncio
async def test_create_venue_as_user_forbidden(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test that regular users cannot create venues."""
    # Create regular user
    user = User(
        phone="+84901234571",
        password_hash=hash_password("SecurePass123"),
        full_name="Regular User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234571",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Try to create venue
    response = await client.post(
        "/api/v1/venues/merchant",
        json={
            "name": "Unauthorized Venue",
            "address": "123 Test St",
            "coordinates": {"lat": 21.0, "lng": 105.8},
            "venue_type": VenueType.FOOTBALL_5.value,
            "base_price_per_hour": 150000,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_venue(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test updating venue by owner."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234572",
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
        name="Old Name",
        address="Old Address",
        district="Dong Da",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.82, 21.01), 4326),  # type: ignore
        venue_type=VenueType.VOLLEYBALL,
        base_price_per_hour=120000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234572", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Update venue
    response = await client.put(
        f"/api/v1/venues/merchant/{venue.id}",
        json={"name": "Updated Name", "description": "New description"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "New description"


@pytest.mark.asyncio
async def test_update_venue_unauthorized(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test updating venue by non-owner."""
    # Create two merchants
    owner = User(
        phone="+84901234573",
        password_hash=hash_password("SecurePass123"),
        full_name="Owner",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(owner)
    await db_session.flush()

    other_merchant = User(
        phone="+84901234574",
        password_hash=hash_password("SecurePass123"),
        full_name="Other Merchant",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(other_merchant)
    await db_session.flush()

    venue = Venue(
        merchant_id=owner.id,
        name="Owner's Venue",
        address="Owner Address",
        district="Tay Ho",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.83, 21.03), 4326),  # type: ignore
        venue_type=VenueType.SWIMMING,
        base_price_per_hour=250000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login as other merchant
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234574", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Try to update
    response = await client.put(
        f"/api/v1/venues/merchant/{venue.id}",
        json={"name": "Hacked Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404  # Not found due to ownership check


@pytest.mark.asyncio
async def test_deactivate_venue(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test venue deactivation."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234575",
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
        name="To Be Closed",
        address="Closing Soon",
        district="Thanh Xuan",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.80, 21.02), 4326),  # type: ignore
        venue_type=VenueType.TABLE_TENNIS,
        base_price_per_hour=80000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234575", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Deactivate
    response = await client.delete(
        f"/api/v1/venues/merchant/{venue.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204

    # Verify it's deactivated
    await db_session.refresh(venue)
    assert venue.is_active is False


@pytest.mark.asyncio
async def test_create_venue_service(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test adding service to venue."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234576",
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
        name="Full Service Venue",
        address="Service St",
        district="Ha Dong",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.75, 21.00), 4326),  # type: ignore
        venue_type=VenueType.FOOTBALL_7,
        base_price_per_hour=200000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234576", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Add service
    response = await client.post(
        f"/api/v1/venues/{venue.id}/services",
        json={
            "name": "Water Bottle",
            "description": "Chilled water",
            "price_per_unit": 10000,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Water Bottle"
    assert data["price_per_unit"] == 10000


@pytest.mark.asyncio
async def test_create_pricing_slot(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test adding pricing time slot."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234577",
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
        name="Dynamic Pricing Venue",
        address="Pricing Rd",
        district="Long Bien",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.88, 21.05), 4326),  # type: ignore
        venue_type=VenueType.FOOTBALL_5,
        base_price_per_hour=150000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234577", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Add pricing slot
    response = await client.post(
        f"/api/v1/venues/{venue.id}/pricing",
        json={
            "day_type": DayType.WEEKEND.value,
            "start_time": "16:00",
            "end_time": "22:00",
            "price_factor": 1.5,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["day_type"] == DayType.WEEKEND.value
    assert data["price_factor"] == 1.5


@pytest.mark.asyncio
async def test_get_venue_availability(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test checking venue availability."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234578",
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
        name="Available Venue",
        address="Availability St",
        district="Hoang Mai",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.85, 21.00), 4326),  # type: ignore
        venue_type=VenueType.BASKETBALL,
        base_price_per_hour=180000,
        is_active=True,
        operating_hours={"open": "06:00", "close": "23:00"},
    )
    db_session.add(venue)
    await db_session.commit()

    # Check availability
    response = await client.get(
        f"/api/v1/venues/{venue.id}/availability",
        params={"date": "2026-04-15"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["venue_id"] == str(venue.id)
    assert data["date"] == "2026-04-15"
    assert len(data["slots"]) > 0
    # All slots should be available since no bookings exist
    assert all(slot["available"] for slot in data["slots"])


@pytest.mark.asyncio
async def test_verify_venue_as_admin(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test venue verification by admin."""
    # Create admin and merchant
    admin = User(
        phone="+84901234579",
        password_hash=hash_password("SecurePass123"),
        full_name="Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin)
    await db_session.flush()

    merchant = User(
        phone="+84901234580",
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
        name="Unverified Venue",
        address="Verification St",
        district="Nam Tu Liem",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.75, 21.02), 4326),  # type: ignore
        venue_type=VenueType.BADMINTON,
        base_price_per_hour=100000,
        is_active=True,
        is_verified=False,
    )
    db_session.add(venue)
    await db_session.commit()

    # Login as admin
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"phone": "+84901234579", "password": "SecurePass123"},
    )
    token = login_response.json()["access_token"]

    # Verify venue
    response = await client.post(
        f"/api/v1/venues/{venue.id}/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    # Check verification
    await db_session.refresh(venue)
    assert venue.is_verified is True


@pytest.mark.asyncio
async def test_list_hanoi_districts(
    client: AsyncClient,
) -> None:
    """Test getting Hanoi districts list."""
    response = await client.get("/api/v1/venues/districts/list")
    assert response.status_code == 200
    data = response.json()
    assert "districts" in data
    assert len(data["districts"]) > 0
    assert "Ba Dinh" in data["districts"]


@pytest.mark.asyncio
async def test_get_venue_services(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test getting venue services."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234581",
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
        name="Service Venue",
        address="Service Ave",
        district="Bac Tu Liem",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.78, 21.04), 4326),  # type: ignore
        venue_type=VenueType.FOOTBALL_5,
        base_price_per_hour=150000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.flush()

    # Add services
    service1 = VenueService(
        venue_id=venue.id,
        name="Jersey Rental",
        price_per_unit=30000,
        is_available=True,
    )
    service2 = VenueService(
        venue_id=venue.id,
        name="Shoe Rental",
        price_per_unit=20000,
        is_available=True,
    )
    db_session.add_all([service1, service2])
    await db_session.commit()

    # Get services
    response = await client.get(f"/api/v1/venues/{venue.id}/services")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(s["name"] == "Jersey Rental" for s in data)


@pytest.mark.asyncio
async def test_get_pricing_slots(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    """Test getting pricing slots."""
    # Create merchant and venue
    merchant = User(
        phone="+84901234582",
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
        name="Pricing Venue",
        address="Pricing Lane",
        district="Phu Xuyen",
        location=geofunc.ST_SetSRID(geofunc.ST_MakePoint(105.70, 20.95), 4326),  # type: ignore
        venue_type=VenueType.FOOTBALL_7,
        base_price_per_hour=200000,
        is_active=True,
    )
    db_session.add(venue)
    await db_session.flush()

    # Add pricing slots
    slot1 = PricingTimeSlot(
        venue_id=venue.id,
        day_type=DayType.WEEKDAY,
        start_time="05:00",
        end_time="16:00",
        price_factor=1.0,
    )
    slot2 = PricingTimeSlot(
        venue_id=venue.id,
        day_type=DayType.WEEKEND,
        start_time="16:00",
        end_time="22:00",
        price_factor=1.5,
    )
    db_session.add_all([slot1, slot2])
    await db_session.commit()

    # Get pricing
    response = await client.get(f"/api/v1/venues/{venue.id}/pricing")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(s["day_type"] == DayType.WEEKDAY.value for s in data)
