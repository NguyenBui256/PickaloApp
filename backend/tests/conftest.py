"""
Pytest configuration and shared fixtures.

Provides common test fixtures for all test modules.
"""

import asyncio
from typing import AsyncGenerator, Generator
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.database import async_session_factory, Base, engine
from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType
from decimal import Decimal
from sqlalchemy import func
from geoalchemy2 import functions as geofunc


@pytest_asyncio.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Create event loop for async tests.

    Yields:
        Event loop for async operations
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def merchant_id() -> str:
    """
    Create test merchant user and return ID.

    Yields:
        Merchant user ID as string
    """
    # Create a test merchant
    merchant_id_val = UUID(bytes=bytes([1] * 16), version=4)

    # This would normally be created in the database
    # For now, just return the UUID
    yield str(merchant_id_val)


@pytest_asyncio.fixture(scope="function")
async def test_session() -> AsyncGenerator:
    """
    Create test database session.

    Creates all tables before test and drops them after.

    Yields:
        Async database session
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def db_session(test_session: AsyncSession) -> AsyncGenerator:
    """
    Alias for test_session for backward compatibility.

    Yields:
        Async database session
    """
    yield test_session


@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator:
    """
    Create async HTTP client for testing.

    Yields:
        AsyncClient configured for FastAPI app
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def test_venues(test_session: AsyncSession, merchant_id: str) -> list[Venue]:
    """
    Create test venues for map tests.

    Args:
        test_session: Database session
        merchant_id: Test merchant ID

    Yields:
        List of test Venue objects
    """
    from app.core.database import get_db

    venues = []
    venue_data = [
        {
            "name": "Hanoi Football Field 1",
            "merchant_id": uuid.UUID(merchant_id),
            "address": "123 Test St",
            "district": "Ba Dinh",
            "location": geofunc.ST_SetSRID(
                geofunc.ST_MakePoint(105.8542, 21.0285),
                4326
            ),
            "venue_type": VenueType.FOOTBALL_5,
            "base_price_per_hour": Decimal("300000"),
            "description": "Test venue",
            "is_active": True,
            "is_verified": True,
        },
        {
            "name": "Hanoi Tennis Court",
            "merchant_id": uuid.UUID(merchant_id),
            "address": "456 Test Ave",
            "district": "Hoan Kiem",
            "location": geofunc.ST_SetSRID(
                geofunc.ST_MakePoint(105.8600, 21.0300),
                4326
            ),
            "venue_type": VenueType.TENNIS,
            "base_price_per_hour": Decimal("200000"),
            "description": "Test venue",
            "is_active": True,
            "is_verified": True,
        },
        {
            "name": "Basketball Court",
            "merchant_id": uuid.UUID(merchant_id),
            "address": "789 Test Rd",
            "district": "Hai Ba Trung",
            "location": geofunc.ST_SetSRID(
                geofunc.ST_MakePoint(105.8500, 21.0250),
                4326
            ),
            "venue_type": VenueType.BASKETBALL,
            "base_price_per_hour": Decimal("250000"),
            "description": "Test venue",
            "is_active": True,
            "is_verified": False,
        },
    ]

    for data in venue_data:
        venue = Venue(**data)
        test_session.add(venue)
        venues.append(venue)

    await test_session.flush()

    await test_session.commit()

    # Refresh to get the created objects
    for venue in venues:
        await test_session.refresh(venue)

    yield venues
