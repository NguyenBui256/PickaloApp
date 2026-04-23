"""
Map-related Pydantic schemas for geospatial venue queries.

Handles map display, venue markers, clustering, and location-based search.
"""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator


class NearbyVenuesRequest(BaseModel):
    """Request for venues near a location."""

    lat: Annotated[float, Field(ge=-90, le=90, description="Latitude")]
    lng: Annotated[float, Field(ge=-180, le=180, description="Longitude")]
    radius: Annotated[int, Field(ge=100, le=50000, default=5000, description="Search radius in meters")]
    venue_type: str | None = Field(None, description="Filter by venue type")
    min_price: Decimal | None = Field(None, ge=0, description="Minimum price per hour")
    max_price: Decimal | None = Field(None, ge=0, description="Maximum price per hour")


class BoundsRequest(BaseModel):
    """Request for venues within map bounds."""

    south: Annotated[float, Field(ge=-90, le=90, description="South latitude")]
    north: Annotated[float, Field(ge=-90, le=90, description="North latitude")]
    west: Annotated[float, Field(ge=-180, le=180, description="West longitude")]
    east: Annotated[float, Field(ge=-180, le=180, description="East longitude")]
    venue_type: str | None = Field(None, description="Filter by venue type")
    min_price: Decimal | None = Field(None, ge=0, description="Minimum price per hour")
    max_price: Decimal | None = Field(None, ge=0, description="Maximum price per hour")

    @field_validator("south", "north")
    @classmethod
    def validate_latitude_order(cls, v: float, info) -> float:
        """Ensure north >= south."""
        if info.data.get("south", -90) > v:
            raise ValueError("north must be >= south")
        return v

    @field_validator("west", "east")
    @classmethod
    def validate_longitude_order(cls, v: float, info) -> float:
        """Ensure east >= west."""
        if info.data.get("west", -180) > v:
            raise ValueError("east must be >= west")
        return v


class VenueMarkerResponse(BaseModel):
    """Venue marker for map display."""

    id: str
    name: str
    lat: float = Field(serialization_alias="latitude")
    lng: float = Field(serialization_alias="longitude")
    venue_type: str
    base_price_per_hour: Decimal
    is_verified: bool
    district: str | None = None
    images: list[str] = []
    amenities: list[str] = []

    class Config:
        populate_by_name = True


class VenueCluster(BaseModel):
    """Clustered venue markers for performance."""

    lat: float = Field(serialization_alias="latitude")
    lng: float = Field(serialization_alias="longitude")
    count: int = Field(description="Number of venues in cluster")
    venues: list[VenueMarkerResponse] = Field(
        default_factory=list,
        description="Preview venues (max 10)",
        max_length=10
    )

    class Config:
        populate_by_name = True


class ClusterRequest(BaseModel):
    """Request for clustered venue markers."""

    south: Annotated[float, Field(ge=-90, le=90)]
    north: Annotated[float, Field(ge=-90, le=90)]
    west: Annotated[float, Field(ge=-180, le=180)]
    east: Annotated[float, Field(ge=-180, le=180)]
    zoom: Annotated[int, Field(ge=1, le=20, description="Map zoom level")]
    venue_type: str | None = None
    min_price: Decimal | None = Field(None, ge=0)
    max_price: Decimal | None = Field(None, ge=0)


class GeoJSONFeature(BaseModel):
    """GeoJSON feature for district boundaries."""

    type: Literal["Feature"] = "Feature"
    geometry: dict[str, Any]
    properties: dict[str, Any] = Field(default_factory=dict)


class DistrictGeoResponse(BaseModel):
    """District GeoJSON response."""

    name: str
    geojson: GeoJSONFeature


class MapVenueListResponse(BaseModel):
    """Response for venue list on map."""

    venues: list[VenueMarkerResponse]
    total: int
    bounds: dict[str, float]  # south, north, west, east


class ClustersResponse(BaseModel):
    """Response for clustered venues."""

    clusters: list[VenueCluster]
    total_venues: int
    bounds: dict[str, float]
