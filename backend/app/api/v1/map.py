"""
Map API endpoints.

Handles geospatial queries for venue discovery on maps.
"""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, DBSession
from app.models.user import User
from app.models.venue import VenueType
from app.schemas.map import (
    NearbyVenuesRequest,
    BoundsRequest,
    ClusterRequest,
    VenueMarkerResponse,
    VenueCluster,
    ClustersResponse,
    DistrictGeoResponse,
    MapVenueListResponse,
)
from app.services.map import MapService, get_map_service

router = APIRouter(prefix="/map", tags=["map"])


@router.get("/nearby", response_model=MapVenueListResponse)
async def get_nearby_venues(
    session: DBSession,
    map_service: Annotated[MapService, Depends(get_map_service)],
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    radius: Annotated[int, Query(ge=100, le=50000)] = 5000,
    venue_type: VenueType | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> MapVenueListResponse:
    """
    Get venues near a location (public endpoint).

    Returns venues within specified radius of coordinates.
    Results ordered by distance (nearest first).
    """
    venues, total = await map_service.get_venues_nearby(
        lat=lat,
        lng=lng,
        radius=radius,
        venue_type=venue_type,
        min_price=min_price,
        max_price=max_price,
    )

    # Convert to marker responses
    items = [
        map_service.venue_to_marker_response(venue)
        for venue in venues
    ]

    # Calculate bounds
    lat_offset = radius / 111000  # Approx meters to degrees
    lng_offset = radius / (111000 * abs(lat / 90)) if lat != 0 else radius / 111000

    bounds = {
        "south": lat - lat_offset,
        "north": lat + lat_offset,
        "west": lng - lng_offset,
        "east": lng + lng_offset,
    }

    return MapVenueListResponse(
        venues=items,
        total=total,
        bounds=bounds,
    )


@router.get("/bounds", response_model=MapVenueListResponse)
async def get_venues_in_bounds(
    session: DBSession,
    map_service: Annotated[MapService, Depends(get_map_service)],
    south: Annotated[float, Query(ge=-90, le=90)],
    north: Annotated[float, Query(ge=-90, le=90)],
    west: Annotated[float, Query(ge=-180, le=180)],
    east: Annotated[float, Query(ge=-180, le=180)],
    venue_type: VenueType | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> MapVenueListResponse:
    """
    Get venues within map bounds (public endpoint).

    Returns all venues inside the rectangular map bounds.
    """
    venues, total = await map_service.get_venues_by_bounds(
        south=south,
        north=north,
        west=west,
        east=east,
        venue_type=venue_type,
        min_price=min_price,
        max_price=max_price,
    )

    # Convert to marker responses
    items = [
        map_service.venue_to_marker_response(venue)
        for venue in venues
    ]

    bounds = {
        "south": south,
        "north": north,
        "west": west,
        "east": east,
    }

    return MapVenueListResponse(
        venues=items,
        total=total,
        bounds=bounds,
    )


@router.get("/clusters", response_model=ClustersResponse)
async def get_venue_clusters(
    session: DBSession,
    map_service: Annotated[MapService, Depends(get_map_service)],
    south: Annotated[float, Query(ge=-90, le=90)],
    north: Annotated[float, Query(ge=-90, le=90)],
    west: Annotated[float, Query(ge=-180, le=180)],
    east: Annotated[float, Query(ge=-180, le=180)],
    zoom: Annotated[int, Query(ge=1, le=20)] = 12,
    venue_type: VenueType | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> ClustersResponse:
    """
    Get clustered venue markers for map (public endpoint).

    Groups nearby venues into clusters for better performance.
    Cluster size adjusts based on zoom level.
    """
    # Get venues in bounds
    venues, total = await map_service.get_venues_by_bounds(
        south=south,
        north=north,
        west=west,
        east=east,
        venue_type=venue_type,
        min_price=min_price,
        max_price=max_price,
    )

    # Create clusters
    cluster_data = map_service.create_venue_clusters(venues, zoom=zoom)

    # Convert to response format
    clusters = []
    for cluster in cluster_data:
        # Convert venue previews to marker responses
        venue_previews = [
            map_service.venue_to_marker_response(venue)
            for venue in cluster["venues"]
        ]

        clusters.append(VenueCluster(
            lat=cluster["lat"],
            lng=cluster["lng"],
            count=cluster["count"],
            venues=venue_previews,
        ))

    bounds = {
        "south": south,
        "north": north,
        "west": west,
        "east": east,
    }

    return ClustersResponse(
        clusters=clusters,
        total_venues=total,
        bounds=bounds,
    )


@router.get("/districts", response_model=list[DistrictGeoResponse])
async def list_hanoi_districts(
    map_service: Annotated[MapService, Depends(get_map_service)],
) -> list[DistrictGeoResponse]:
    """
    Get all Hanoi districts as GeoJSON (public endpoint).

    Returns district boundaries for map overlays.
    """
    return await map_service.get_hanoi_districts_geo()


@router.get("/districts/{district_name}", response_model=DistrictGeoResponse)
async def get_district_boundary(
    district_name: str,
    map_service: Annotated[MapService, Depends(get_map_service)],
) -> DistrictGeoResponse:
    """
    Get single district boundary by name (public endpoint).

    Returns GeoJSON polygon for district overlay.
    """
    district = await map_service.get_district_geojson(district_name)

    if not district:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"District '{district_name}' not found",
        )

    return district
