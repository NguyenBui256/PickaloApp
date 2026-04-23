"""
Map business logic service.

Handles geospatial queries, venue clustering, and map data operations.
"""

from decimal import Decimal
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import functions as geofunc
from geoalchemy2.types import Geography

from app.core.database import get_db
from app.models.venue import Venue, VenueType
from app.schemas.map import (
    VenueMarkerResponse,
    VenueCluster,
    GeoJSONFeature,
    DistrictGeoResponse,
)


class MapService:
    """
    Service for map and geospatial operations.

    Methods:
        get_venues_by_bounds: Get venues within map bounds
        get_venues_nearby: Radius search around coordinates
        create_venue_clusters: Cluster venues by zoom level
        get_district_geojson: Return district boundary
        get_hanoi_districts_geo: All Hanoi districts GeoJSON
        venue_to_geojson: Convert venue to GeoJSON feature
    """

    # Hanoi districts GeoJSON (simplified boundaries)
    # In production, load from GeoJSON file or database
    HANOI_DISTRICTS_GEOJSON = {
        "Ba Dinh": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[105.78, 21.04], [105.82, 21.04], [105.82, 21.02], [105.78, 21.02], [105.78, 21.04]]]
            },
            "properties": {"name": "Ba Dinh", "name_en": "Ba Dinh"}
        },
        "Hoan Kiem": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[105.84, 21.04], [105.86, 21.04], [105.86, 21.02], [105.84, 21.02], [105.84, 21.04]]]
            },
            "properties": {"name": "Hoan Kiem", "name_en": "Hoan Kiem"}
        },
        # Add other districts...
    }

    def __init__(self, session: AsyncSession):
        """Initialize map service with database session."""
        self.session = session

    async def get_venues_by_bounds(
        self,
        south: float,
        north: float,
        west: float,
        east: float,
        venue_type: VenueType | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
    ) -> tuple[list[Venue], int]:
        """
        Get venues within map bounds.

        Uses PostGIS ST_Within to find venues in rectangular bounds.

        Args:
            south: South latitude
            north: North latitude
            west: West longitude
            east: East longitude
            venue_type: Optional venue type filter
            min_price: Optional minimum price filter
            max_price: Optional maximum price filter

        Returns:
            Tuple of (venues list, total count)
        """
        # Build polygon for bounds
        bounds_polygon = f"POLYGON(({west} {south}, {east} {south}, {east} {north}, {west} {north}, {west} {south}))"

        # Build query conditions
        conditions = [
            Venue.is_active.is_(True),
            Venue.deleted_at.is_(None),
            geofunc.ST_Within(
                Venue.location,
                geofunc.ST_GeomFromText(bounds_polygon, 4326)
            ),
        ]

        if venue_type:
            conditions.append(Venue.venue_type == venue_type)

        if min_price is not None:
            conditions.append(Venue.base_price_per_hour >= min_price)

        if max_price is not None:
            conditions.append(Venue.base_price_per_hour <= max_price)

        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(Venue).where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get results
        result = await self.session.execute(
            select(Venue)
            .where(and_(*conditions))
            .order_by(Venue.created_at.desc())
        )
        venues = list(result.scalars().all())

        return venues, total

    async def get_venues_nearby(
        self,
        lat: float,
        lng: float,
        radius: float = 5000,
        venue_type: VenueType | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        limit: int = 50,
    ) -> tuple[list[Venue], int]:
        """
        Search venues within radius using PostGIS.

        Uses ST_DWithin for efficient geospatial search.

        Args:
            lat: Center latitude
            lng: Center longitude
            radius: Search radius in meters (default: 5000m = 5km)
            venue_type: Optional venue type filter
            min_price: Optional minimum price filter
            max_price: Optional maximum price filter
            limit: Maximum results to return

        Returns:
            Tuple of (venues list, total count)
        """
        # Create point from coordinates
        point = geofunc.ST_SetSRID(geofunc.ST_MakePoint(lng, lat), 4326)

        # Build conditions
        conditions = [
            Venue.is_active.is_(True),
            Venue.deleted_at.is_(None),
            geofunc.ST_DWithin(Venue.location, point, radius),
        ]

        if venue_type:
            conditions.append(Venue.venue_type == venue_type)

        if min_price is not None:
            conditions.append(Venue.base_price_per_hour >= min_price)

        if max_price is not None:
            conditions.append(Venue.base_price_per_hour <= max_price)

        # Get total count
        count_result = await self.session.execute(
            select(func.count())
            .select_from(Venue)
            .where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get results ordered by distance
        result = await self.session.execute(
            select(Venue)
            .where(and_(*conditions))
            .order_by(geofunc.ST_Distance(Venue.location, point))
            .limit(limit)
        )
        venues = list(result.scalars().all())

        return venues, total

    def create_venue_clusters(
        self,
        venues: list[Venue],
        zoom: int,
        grid_size: float = 0.01,
    ) -> list[dict[str, Any]]:
        """
        Cluster venues by zoom level for performance.

        Grid-based clustering: groups nearby venues into clusters.
        Grid size adjusts based on zoom level.

        Args:
            venues: List of venues to cluster
            zoom: Map zoom level (1-20)
            grid_size: Grid cell size in degrees

        Returns:
            List of cluster dicts with lat, lng, count, venues
        """
        # Adjust grid size based on zoom
        # Higher zoom = smaller grid = more precision
        if zoom >= 14:
            grid_size = 0.005
        elif zoom >= 12:
            grid_size = 0.01
        elif zoom >= 10:
            grid_size = 0.02
        else:
            grid_size = 0.04

        clusters = {}

        for venue in venues:
            # Extract coordinates from PostGIS geography
            # Note: In production, use ST_X and ST_Y functions
            # For now, assume venue has lat/lng properties
            if not hasattr(venue, "latitude") or not hasattr(venue, "longitude"):
                # Skip venues without coordinates
                continue

            lat = float(venue.latitude) if hasattr(venue, "latitude") else 0.0
            lng = float(venue.longitude) if hasattr(venue, "longitude") else 0.0

            grid_x = int(lng / grid_size)
            grid_y = int(lat / grid_size)
            key = f"{grid_x}_{grid_y}"

            if key not in clusters:
                clusters[key] = {
                    "lat": lat,
                    "lng": lng,
                    "count": 0,
                    "venues": [],
                }

            clusters[key]["count"] += 1

            # Add preview venues (max 10 per cluster)
            if len(clusters[key]["venues"]) < 10:
                clusters[key]["venues"].append(venue)

        return list(clusters.values())

    async def get_district_geojson(self, district_name: str) -> DistrictGeoResponse | None:
        """
        Get GeoJSON for a Hanoi district.

        Args:
            district_name: Name of the district

        Returns:
            DistrictGeoResponse or None if not found
        """
        geojson_data = self.HANOI_DISTRICTS_GEOJSON.get(district_name)

        if not geojson_data:
            return None

        return DistrictGeoResponse(
            name=district_name,
            geojson=GeoJSONFeature(**geojson_data)
        )

    async def get_hanoi_districts_geo(self) -> list[DistrictGeoResponse]:
        """
        Get all Hanoi districts as GeoJSON.

        Returns:
            List of DistrictGeoResponse for all districts
        """
        districts = []

        for district_name, geojson_data in self.HANOI_DISTRICTS_GEOJSON.items():
            districts.append(DistrictGeoResponse(
                name=district_name,
                geojson=GeoJSONFeature(**geojson_data)
            ))

        return districts

    def venue_to_marker_response(self, venue: Venue) -> VenueMarkerResponse:
        """
        Convert Venue model to VenueMarkerResponse.

        Args:
            venue: Venue instance

        Returns:
            VenueMarkerResponse for map display
        """
        return VenueMarkerResponse(
            id=str(venue.id),
            name=venue.name,
            lat=0.0,  # Extract from PostGIS location
            lng=0.0,  # Extract from PostGIS location
            venue_type=venue.venue_type.value if hasattr(venue.venue_type, "value") else str(venue.venue_type),
            base_price_per_hour=venue.base_price_per_hour,
            is_verified=venue.is_verified,
            district=venue.district,
            images=venue.images or [],
            amenities=venue.amenities or [],
        )

    def venue_to_geojson(self, venue: Venue) -> dict[str, Any]:
        """
        Convert venue to GeoJSON feature.

        Args:
            venue: Venue instance

        Returns:
            GeoJSON feature dict
        """
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [0.0, 0.0]  # [lng, lat] from PostGIS
            },
            "properties": {
                "id": str(venue.id),
                "name": venue.name,
                "venue_type": venue.venue_type.value if hasattr(venue.venue_type, "value") else str(venue.venue_type),
                "base_price_per_hour": float(venue.base_price_per_hour),
                "is_verified": venue.is_verified,
                "district": venue.district,
            }
        }


async def get_map_service(session: Annotated[AsyncSession, Depends(get_db)]) -> MapService:
    """
    Dependency to get map service instance.

    Args:
        session: Database session

    Returns:
        MapService instance
    """
    return MapService(session)
