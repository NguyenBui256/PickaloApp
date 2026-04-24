"""
Booking schemas for request and response.

Pydantic models for booking data validation and serialization.
"""

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.models.booking import BookingStatus


class BookingServiceRequest(BaseModel):
    """Service to include in booking."""

    service_id: uuid.UUID
    quantity: Annotated[int, Field(ge=1, le=100)] = 1


class BookingSlotInfo(BaseModel):
    """Specific slot in a multi-court booking."""

    court_id: uuid.UUID
    start_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$", description="Start time (HH:MM format)"),
    ]
    end_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$", description="End time (HH:MM format)"),
    ]

    @field_validator("end_time")
    @classmethod
    def end_time_after_start(cls, v: str, info) -> str:
        """Validate end time is after start time."""
        start_time = info.data.get("start_time")
        if start_time and v <= start_time:
            raise ValueError("end_time must be after start_time")
        return v


class BookingCreate(BaseModel):
    """Schema for creating a new booking with multiple slots."""

    venue_id: uuid.UUID
    booking_date: Annotated[
        date,
        Field(description="Booking date (ISO 8601 format)"),
    ]
    slots: list[BookingSlotInfo]
    services: Annotated[
        list[BookingServiceRequest] | None,
        Field(description="Additional services to book"),
    ] = None
    notes: Annotated[
        str | None,
        Field(max_length=1000, description="Special requests or notes"),
    ] = None
    payment_proof: Annotated[
        str | None,
        Field(max_length=500, description="URL to payment proof image"),
    ] = None


    @field_validator("booking_date")
    @classmethod
    def date_not_in_past(cls, v: date) -> date:
        """Validate booking date is not in the past."""
        if v < date.today():
            raise ValueError("booking_date cannot be in the past")
        return v


class BookingPriceSlot(BaseModel):
    """Specific slot for price calculation."""
    court_id: uuid.UUID | None = None
    start_time: str
    end_time: str


class BookingPricePreview(BaseModel):
    """Schema for price calculation requests."""

    venue_id: uuid.UUID
    booking_date: date
    slots: list[BookingPriceSlot]
    services: list[BookingServiceRequest] | None = None


class PriceBreakdown(BaseModel):
    """Price breakdown component."""

    duration_hours: Decimal
    hourly_price: Decimal
    subtotal: Decimal
    service_fee: Decimal
    total: Decimal


class BookingServiceItem(BaseModel):
    """Service item in booking."""

    service_id: str
    name: str
    quantity: int
    unit_price: Decimal
    total: Decimal


class BookingPriceSlotResponse(BaseModel):
    """Price breakdown for a specific slot."""
    start_time: str
    end_time: str
    court_id: uuid.UUID | None = None
    pricing: PriceBreakdown


class BookingPriceResponse(BaseModel):
    """Full price breakdown response for multiple slots."""

    booking_date: date
    slots: list[BookingPriceSlotResponse]
    services: list[BookingServiceItem] | None = None
    services_total: Decimal
    subtotal: Decimal
    service_fee: Decimal
    total: Decimal
    currency: str = "VND"


class BookingSlotResponse(BaseModel):
    """Schema for a specific slot in a booking."""

    id: uuid.UUID
    court_id: uuid.UUID
    court_name: str | None = None
    start_time: time
    end_time: time
    price: Decimal

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    """Full booking response."""

    id: uuid.UUID
    user_id: uuid.UUID
    venue_id: uuid.UUID
    booking_date: date

    # Pricing
    total_price: Decimal

    # Status
    status: BookingStatus
    is_paid: bool
    is_cancelable: bool
    is_active: bool

    # Payment
    payment_method: str | None
    payment_id: str | None
    paid_at: datetime | None
    payment_proof: str | None

    # Additional info
    notes: str | None
    cancelled_at: datetime | None
    cancelled_by: str | None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Relations
    venue_name: str | None = None
    venue_address: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    match_id: uuid.UUID | None = None
    slots: list[BookingSlotResponse] = []
    services: list[BookingServiceItem] = []

    model_config = {"from_attributes": True}


class BookingListItem(BaseModel):
    """Simplified booking for list views."""

    id: uuid.UUID
    venue_id: uuid.UUID
    venue_name: str | None
    venue_address: str | None
    booking_date: date
    total_price: Decimal
    status: BookingStatus
    is_paid: bool
    is_cancelable: bool
    has_match: bool = False
    match_id: uuid.UUID | None = None
    created_at: datetime
    customer_name: str | None = None
    customer_phone: str | None = None
    payment_proof: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    court_name: str | None = None


class BookingCancel(BaseModel):
    """Schema for booking cancellation request."""

    reason: Annotated[
        str | None,
        Field(max_length=500, description="Reason for cancellation"),
    ] = None


class BookingApproveReject(BaseModel):
    """Schema for merchant approve/reject request."""

    reason: Annotated[
        str | None,
        Field(max_length=500, description="Reason for rejection (optional for approval)"),
    ] = None


class BookingListFilters(BaseModel):
    """Query parameters for booking list."""

    status: BookingStatus | None = None
    date_from: date | None = None
    date_to: date | None = None
    venue_id: uuid.UUID | None = None


class BookingListResponse(BaseModel):
    """Paginated booking list response."""

    items: list[BookingListItem]
    total: int
    page: int
    limit: int
    pages: int




class MerchantVenueStats(BaseModel):
    """Stats for a specific venue owned by the merchant."""

    id: str
    name: str
    status: str # ACTIVE, PENDING
    total_bookings: int # Bốn tuần gần nhất hoặc tháng hiện tại
    revenue_mtd: Decimal
    rating: float


class MerchantStatsResponse(BaseModel):
    """Response containing a list of venue statistics."""

    venues: list[MerchantVenueStats]
    currency: str = "VND"

class RevenueTrendItem(BaseModel):
    """Daily revenue item."""
    date: str
    revenue: Decimal
    booking_count: int


class RevenueTrendResponse(BaseModel):
    """Response containing revenue trend data."""
    items: list[RevenueTrendItem]
    total_revenue: Decimal
    total_bookings: int
    currency: str = "VND"
