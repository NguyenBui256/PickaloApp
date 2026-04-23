"""
Venue schemas for request and response.

Pydantic models for venue data validation and serialization.
"""

from uuid import UUID
from decimal import Decimal
from typing import Annotated, Literal
from pydantic import BaseModel, Field, field_validator

from app.models.venue import VenueType, DayType


class VenueBase(BaseModel):
    """Base venue fields shared across schemas."""

    name: Annotated[str, Field(min_length=2, max_length=255)]
    address: Annotated[str, Field(min_length=5, max_length=500)]
    district: Annotated[str | None, Field(max_length=50)] = None
    description: Annotated[str | None, None] = None


class Coordinates(BaseModel):
    """GPS coordinates for venue location."""

    lat: Annotated[
        float,
        Field(
            ge=-90.0,
            le=90.0,
            description="Latitude (-90 to 90)",
        ),
    ]
    lng: Annotated[
        float,
        Field(
            ge=-180.0,
            le=180.0,
            description="Longitude (-180 to 180)",
        ),
    ]


class VenueCreate(VenueBase):
    """Schema for creating a new venue."""

    coordinates: Coordinates
    venue_type: VenueType
    images: list[str] | None = None
    operating_hours: dict | None = None
    amenities: list[str] | None = None
    base_price_per_hour: Annotated[
        Decimal,
        Field(
            gt=0,
            description="Base price per hour (VND)",
        ),
    ]


class VenueUpdate(BaseModel):
    """Schema for updating a venue (all fields optional)."""

    name: Annotated[str | None, Field(min_length=2, max_length=255)] = None
    address: Annotated[str | None, Field(min_length=5, max_length=500)] = None
    district: Annotated[str | None, Field(max_length=50)] = None
    coordinates: Coordinates | None = None
    description: str | None = None
    images: list[str] | None = None
    operating_hours: dict | None = None
    amenities: list[str] | None = None
    base_price_per_hour: Annotated[
        Decimal | None,
        Field(
            gt=0,
            description="Base price per hour (VND)",
        ),
    ] = None
    is_active: bool | None = None


class OperatingHours(BaseModel):
    """Operating hours schema."""

    open: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")] = "05:00"
    close: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")] = "23:00"


class VenueResponse(VenueBase):
    """Full venue response with all details."""

    id: str
    merchant_id: str
    location: Coordinates
    venue_type: VenueType
    images: list[str] | None = None
    operating_hours: OperatingHours | None = None
    amenities: list[str] | None = None
    base_price_per_hour: Decimal
    is_active: bool
    is_verified: bool
    fullAddress: str | None = None
    logo: str | None = None
    rating: float | None = 0.0
    review_count: int | None = 0
    bookingLink: str | None = None
    category: str | None = None
    created_at: str
    updated_at: str
    courts: list["CourtResponse"] | None = None

    model_config = {"from_attributes": True}


class CourtResponse(BaseModel):
    """Court response schema."""

    id: UUID
    venue_id: UUID
    name: str
    is_active: bool

    model_config = {"from_attributes": True}


class VenueListItem(BaseModel):
    """Simplified venue for list views."""

    id: str
    name: str
    district: str | None = None
    address: str | None = None
    fullAddress: str | None = None
    venue_type: VenueType
    location: Coordinates
    base_price_per_hour: Decimal
    is_verified: bool
    images: list[str] | None = None
    amenities: list[str] | None = None
    logo: str | None = None
    bookingLink: str | None = None
    category: str | None = None
    rating: float | None = 0.0
    review_count: int | None = 0


class VenueServiceCreate(BaseModel):
    """Schema for creating a venue service."""

    name: Annotated[str, Field(min_length=2, max_length=100)]
    description: str | None = None
    price_per_unit: Annotated[
        Decimal,
        Field(gt=0),
    ]


class VenueServiceUpdate(BaseModel):
    """Schema for updating a venue service."""

    name: Annotated[str | None, Field(min_length=2, max_length=100)] = None
    description: str | None = None
    price_per_unit: Annotated[
        Decimal | None,
        Field(gt=0),
    ] = None
    is_available: bool | None = None


class VenueServiceResponse(BaseModel):
    """Schema for venue service response."""

    id: str
    venue_id: str
    name: str
    description: str | None
    price_per_unit: Decimal
    is_available: bool
    created_at: str


class CourtCreate(BaseModel):
    """Schema for creating a new court."""

    name: Annotated[str, Field(min_length=1, max_length=100)]
    is_active: bool = True


class CourtUpdate(BaseModel):
    """Schema for updating a court."""

    name: Annotated[str | None, Field(min_length=1, max_length=100)] = None
    is_active: bool | None = None


class PricingSlotCreate(BaseModel):
    """Schema for creating a pricing time slot."""

    day_type: DayType
    start_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    end_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    price_factor: Annotated[
        Decimal,
        Field(
            ge=Decimal("0.1"),
            le=Decimal("3.0"),
            default=Decimal("1.0"),
        ),
    ] = Decimal("1.0")

    @field_validator("end_time")
    @classmethod
    def end_time_after_start(cls, v: str, info) -> str:
        """Validate end time is after start time."""
        start_time = info.data.get("start_time")
        if start_time and v <= start_time:
            raise ValueError("end_time must be after start_time")
        return v


class PricingSlotUpdate(BaseModel):
    """Schema for updating a pricing time slot."""

    day_type: DayType | None = None
    start_time: Annotated[
        str | None,
        Field(pattern=r"^\d{2}:\d{2}$"),
    ] = None
    end_time: Annotated[
        str | None,
        Field(pattern=r"^\d{2}:\d{2}$"),
    ] = None
    price_factor: Annotated[
        Decimal | None,
        Field(
            ge=Decimal("0.1"),
            le=Decimal("3.0"),
        ),
    ] = None


class PricingSlotResponse(BaseModel):
    """Schema for pricing slot response."""

    id: int
    venue_id: str
    day_type: DayType
    start_time: str
    end_time: str
    price_factor: Decimal


class VenueSearchParams(BaseModel):
    """Query parameters for venue search."""

    district: str | None = None
    venue_type: VenueType | None = None
    lat: float | None = None
    lng: float | None = None
    radius: Annotated[
        float | None,
        Field(
            ge=100,
            le=50000,
            description="Search radius in meters (100m to 50km)",
        ),
    ] = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    has_parking: bool | None = None
    has_lights: bool | None = None
    page: Annotated[int, Field(ge=1)] = 1
    limit: Annotated[int, Field(ge=1, le=100)] = 20


class VenueListResponse(BaseModel):
    """Paginated venue list response."""

    items: list[VenueListItem]
    total: int
    page: int
    limit: int
    pages: int


class AvailabilityRequest(BaseModel):
    """Schema for checking venue availability."""

    date: str  # ISO 8601 date format


class SlotAvailability(BaseModel):
    """Available time slot for a court."""

    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    available: bool
    price: float


class CourtAvailability(BaseModel):
    """Availability per court."""

    court_id: str
    court_name: str
    slots: list[SlotAvailability]


class AvailabilityResponse(BaseModel):
    """Venue availability response (Refactored for multi-court)."""

    venue_id: str
    date: str
    open_time: str
    close_time: str
    courts: list[CourtAvailability]


class MerchantVenueListItem(BaseModel):
    """Simplified venue for merchant dashboard."""

    id: str
    name: str
    status: str  # active, inactive, pending
    total_bookings: int = 0
    revenue_mtd: float = 0.0
    rating: float = 0.0


class MerchantVenueListResponse(BaseModel):
    """Paginated merchant venue list response."""

    items: list[MerchantVenueListItem]
    total: int
    page: int
    limit: int
    pages: int
