"""
Map API endpoint tests.

Tests for geospatial queries, clustering, and map data operations.
"""

import pytest
from decimal import Decimal
from httpx import AsyncClient
from uuid import UUID

from app.main import app
from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType
from app.core.database import get_db
from geoalchemy2 import functions as geofunc


@pytest.mark.asyncio
class TestNearbyVenues:
    """Test nearby venues endpoint."""

    async def test_get_nearby_venues_success(
        self,
        client: AsyncClient,
        db_session,
    ):
        """Test getting venues near a location."""
        # Create test venue
        venue = Venue(
            name="Hanoi Football Field 1",
            merchant_id=UUID(bytes=bytes([1] * 16), version=4),
            address="123 Test St",
            district="Ba Dinh",
            location=geofunc.ST_SetSRID(
                geofunc.ST_MakePoint(105.8542, 21.0285),
                4326
            ),
            venue_type=VenueType.FOOTBALL_5,
            base_price_per_hour=Decimal("300000"),
            description="Test venue",
            is_active=True,
            is_verified=True,
        )
        db_session.add(venue)
        await db_session.commit()

        response = await client.get(
            "/api/v1/map/nearby",
            params={
                "lat": 21.0285,
                "lng": 105.8542,
                "radius": 5000,
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "venues" in data
        assert "total" in data
        assert "bounds" in data
        assert data["total"] >= 0
        assert isinstance(data["venues"], list)

    async def test_get_nearby_venues_invalid_coordinates(
        self,
        client: AsyncClient,
    ):
        """Test nearby venues with invalid coordinates."""
        response = await client.get(
            "/api/v1/map/nearby",
            params={
                "lat": 100,  # Invalid latitude
                "lng": 105.8542,
                "radius": 5000,
            }
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
class TestVenuesInBounds:
    """Test venues in bounds endpoint."""

    async def test_get_venues_in_bounds_success(
        self,
        client: AsyncClient,
        db_session,
    ):
        """Test getting venues within bounds."""
        response = await client.get(
            "/api/v1/map/bounds",
            params={
                "south": 21.0200,
                "north": 21.0400,
                "west": 105.8400,
                "east": 105.8800,
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "venues" in data
        assert "total" in data
        assert "bounds" in data
        assert isinstance(data["venues"], list)

    async def test_get_venues_in_bounds_invalid_bounds(
        self,
        client: AsyncClient,
    ):
        """Test venues with invalid bounds (north < south)."""
        response = await client.get(
            "/api/v1/map/bounds",
            params={
                "south": 21.0400,  # Higher than north
                "north": 21.0200,
                "west": 105.8400,
                "east": 105.8800,
            }
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
class TestVenueClusters:
    """Test venue clustering endpoint."""

    async def test_get_venue_clusters_success(
        self,
        client: AsyncClient,
        db_session,
    ):
        """Test getting clustered venues."""
        response = await client.get(
            "/api/v1/map/clusters",
            params={
                "south": 21.0200,
                "north": 21.0400,
                "west": 105.8400,
                "east": 105.8800,
                "zoom": 12,
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "clusters" in data
        assert "total_venues" in data
        assert "bounds" in data
        assert isinstance(data["clusters"], list)


@pytest.mark.asyncio
class TestDistrictGeoJSON:
    """Test district GeoJSON endpoints."""

    async def test_list_hanoi_districts(
        self,
        client: AsyncClient,
    ):
        """Test getting all Hanoi districts."""
        response = await client.get("/api/v1/map/districts")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        # Should have at least Ba Dinh and Hoan Kiem
        assert len(data) >= 2

        # Verify district structure
        for district in data:
            assert "name" in district
            assert "geojson" in district
            assert district["geojson"]["type"] == "Feature"

    async def test_get_single_district_success(
        self,
        client: AsyncClient,
    ):
        """Test getting single district boundary."""
        response = await client.get("/api/v1/map/districts/Ba Dinh")

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "Ba Dinh"
        assert "geojson" in data
        assert data["geojson"]["type"] == "Feature"

    async def test_get_single_district_not_found(
        self,
        client: AsyncClient,
    ):
        """Test getting non-existent district."""
        response = await client.get("/api/v1/map/districts/NonExistent")

        assert response.status_code == 404


@pytest.mark.asyncio
class TestMapIntegration:
    """Integration tests for map functionality."""

    async def test_complete_map_workflow(
        self,
        client: AsyncClient,
    ):
        """Test complete map workflow: bounds → clusters → nearby."""
        # Step 1: Get venues in bounds
        bounds_response = await client.get(
            "/api/v1/map/bounds",
            params={
                "south": 21.0200,
                "north": 21.0400,
                "west": 105.8400,
                "east": 105.8800,
            }
        )
        assert bounds_response.status_code == 200
        bounds_data = bounds_response.json()

        # Step 2: Get clusters for same bounds
        clusters_response = await client.get(
            "/api/v1/map/clusters",
            params={
                "south": 21.0200,
                "north": 21.0400,
                "west": 105.8400,
                "east": 105.8800,
                "zoom": 12,
            }
        )
        assert clusters_response.status_code == 200
        clusters_data = clusters_response.json()

        # Step 3: Get nearby venues from center
        nearby_response = await client.get(
            "/api/v1/map/nearby",
            params={
                "lat": 21.0285,
                "lng": 105.8542,
                "radius": 5000,
            }
        )
        assert nearby_response.status_code == 200
        nearby_data = nearby_response.json()

        # Verify basic structure
        assert "venues" in nearby_data
        assert "total" in nearby_data
