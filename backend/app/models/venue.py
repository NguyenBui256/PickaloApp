"""
Venue models with PostGIS geospatial support.

Includes:
- Venue: Main venue model with location data
- PricingTimeSlot: Dynamic pricing configuration
- VenueService: Add-on services (water, rental, etc.)
"""

import uuid
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text, Numeric, Boolean, Time, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography  # PostGIS support

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.review import VenueReview
    from app.models.court import Court


class VenueType(str, Enum):
    """Types of sports venues available on the platform."""

    FOOTBALL_5 = "Football 5"
    FOOTBALL_7 = "Football 7"
    TENNIS = "Tennis"
    BADMINTON = "Badminton"
    BASKETBALL = "Basketball"
    VOLLEYBALL = "Volleyball"
    SWIMMING = "Swimming"
    TABLE_TENNIS = "Table Tennis"
    PICKLEBALL = "Pickleball"


class DayType(str, Enum):
    """Day types for dynamic pricing configuration."""

    WEEKDAY = "WEEKDAY"
    WEEKEND = "WEEKEND"
    HOLIDAY = "HOLIDAY"


class Venue(BaseModel):
    """
    Sports venue model.

    Attributes:
        merchant_id: Owner of this venue
        name: Venue display name
        address: Full street address
        district: Hanoi district (Quan/Huyen)
        location: PostGIS point (longitude, latitude)
        venue_type: Type of sports facility
        description: Detailed description
        images: Array of image URLs
        operating_hours: JSON with open/close times
        amenities: List of available amenities
        base_price_per_hour: Base pricing before multipliers
        is_active: Venue status
        is_verified: Admin verification status
    """

    # Ownership
    merchant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic info
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    district: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    # Geospatial location (PostGIS)
    # Stores as geography point for accurate distance calculations
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=False,
    )

    # Venue details
    venue_type: Mapped[VenueType] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    cover_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # JSON fields for flexible data
    images: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )
    operating_hours: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    amenities: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    logo: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    booking_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Pricing
    base_price_per_hour: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    # Status and verification
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Rating summary (denormalized for performance)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    merchant: Mapped["User"] = relationship(
        "User",
        back_populates="venues",
        lazy="selectin",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking",
        back_populates="venue",
        lazy="selectin",
    )
    courts: Mapped[list["Court"]] = relationship(
        "Court",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    pricing_slots: Mapped[list["PricingTimeSlot"]] = relationship(
        "PricingTimeSlot",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    services: Mapped[list["VenueService"]] = relationship(
        "VenueService",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    reviews: Mapped[list["VenueReview"]] = relationship(
        "VenueReview",
        back_populates="venue",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    @property
    def latitude(self) -> float | None:
        """Extract latitude from PostGIS location."""
        if self.location is not None:
            from geoalchemy2.shape import to_shape
            try:
                return to_shape(self.location).y
            except Exception:
                return None
        return None

    @property
    def longitude(self) -> float | None:
        """Extract longitude from PostGIS location."""
        if self.location is not None:
            from geoalchemy2.shape import to_shape
            try:
                return to_shape(self.location).x
            except Exception:
                return None
        return None

    def to_dict(self) -> dict[str, Any]:
        """Convert venue to dictionary with location coordinates."""
        data = super().to_dict()
        # Convert PostGIS location to lat/lng dict
        if self.location:
            data["location"] = {
                "latitude": self.latitude,
                "longitude": self.longitude,
            }
        return data

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"Venue(id={self.id!r}, name={self.name!r}, type={self.venue_type.value})"


class PricingTimeSlot(BaseModel):
    """
    Dynamic pricing time slot configuration.

    Allows different price multipliers based on:
    - Day type (weekday, weekend, holiday)
    - Time of day (peak vs off-peak hours)
    """

    __tablename__ = "pricing_time_slots"

    # Ownership
    venue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Slot definition
    day_type: Mapped[DayType] = mapped_column(
        String(20),
        nullable=False,
    )
    # New: days of week (0=Mon, ..., 6=Sun)
    days_of_week: Mapped[list[int] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    title: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    start_time: Mapped[str] = mapped_column(
        Time,
        nullable=False,
    )
    end_time: Mapped[str] = mapped_column(
        Time,
        nullable=False,
    )

    # Price amount (e.g., 500000 VND)
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Whether this is the default price for the day type
    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationship
    venue: Mapped["Venue"] = relationship(
        "Venue",
        back_populates="pricing_slots",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"PricingTimeSlot(id={self.id!r}, day_type={self.day_type.value}, "
            f"price={self.price}, is_default={self.is_default})"
        )


class VenueService(BaseModel):
    """
    Additional services offered by venues.

    Examples:
    - Water bottles
    - Bib/jersey rental
    - Shoe rental
    - Equipment rental
    """

    __tablename__ = "venue_services"

    # Ownership
    venue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Service details
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Pricing
    price_per_unit: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Availability
    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationship
    venue: Mapped["Venue"] = relationship(
        "Venue",
        back_populates="services",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"VenueService(id={self.id!r}, name={self.name!r}, price={self.price_per_unit})"
