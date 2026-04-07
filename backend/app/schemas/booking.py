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


class BookingCreate(BaseModel):
    """Schema for creating a new booking."""

    venue_id: uuid.UUID
    booking_date: Annotated[
        date,
        Field(description="Booking date (ISO 8601 format)"),
    ]
    start_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$", description="Start time (HH:MM format)"),
    ]
    end_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$", description="End time (HH:MM format)"),
    ]
    services: Annotated[
        list[BookingServiceRequest] | None,
        Field(description="Additional services to book"),
    ] = None
    notes: Annotated[
        str | None,
        Field(max_length=1000, description="Special requests or notes"),
    ] = None

    @field_validator("end_time")
    @classmethod
    def end_time_after_start(cls, v: str, info) -> str:
        """Validate end time is after start time."""
        start_time = info.data.get("start_time")
        if start_time and v <= start_time:
            raise ValueError("end_time must be after start_time")
        return v

    @field_validator("booking_date")
    @classmethod
    def date_not_in_past(cls, v: date) -> date:
        """Validate booking date is not in the past."""
        if v < date.today():
            raise ValueError("booking_date cannot be in the past")
        return v


class BookingPricePreview(BaseModel):
    """Schema for price preview request."""

    venue_id: uuid.UUID
    booking_date: date
    start_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$"),
    ]
    end_time: Annotated[
        str,
        Field(pattern=r"^\d{2}:\d{2}$"),
    ]
    services: list[BookingServiceRequest] | None = None


class PriceBreakdown(BaseModel):
    """Price breakdown component."""

    base_price: Decimal
    duration_hours: Decimal
    price_factor: Decimal
    hourly_price: Decimal
    subtotal: Decimal
    service_fee: Decimal
    total: Decimal
    currency: Annotated[str, Field(default="VND")]


class BookingServiceItem(BaseModel):
    """Service item in booking."""

    service_id: str
    name: str
    quantity: int
    unit_price: Decimal
    total: Decimal


class BookingPriceResponse(BaseModel):
    """Price calculation response."""

    venue_pricing: PriceBreakdown
    services: list[BookingServiceItem]
    services_total: Decimal
    subtotal: Decimal
    service_fee: Decimal
    total: Decimal
    currency: Annotated[str, Field(default="VND")]


class BookingResponse(BaseModel):
    """Full booking response."""

    id: str
    user_id: str
    venue_id: str
    booking_date: str
    start_time: str
    end_time: str
    duration_minutes: int

    # Pricing
    base_price: Decimal
    price_factor: Decimal
    service_fee: Decimal
    total_price: Decimal

    # Status
    status: BookingStatus
    is_paid: bool
    is_cancelable: bool
    is_active: bool

    # Payment
    payment_method: str | None
    payment_id: str | None
    paid_at: str | None

    # Additional info
    notes: str | None
    cancelled_at: str | None
    cancelled_by: str | None

    # Timestamps
    created_at: str
    updated_at: str

    # Relations (simplified)
    venue_name: str | None = None
    venue_address: str | None = None
    services: list[BookingServiceItem] = []

    model_config = {"from_attributes": True}


class BookingListItem(BaseModel):
    """Simplified booking for list views."""

    id: str
    venue_id: str
    venue_name: str | None
    venue_address: str | None
    booking_date: str
    start_time: str
    end_time: str
    total_price: Decimal
    status: BookingStatus
    is_paid: bool
    is_cancelable: bool
    created_at: str


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


class TimeSlot(BaseModel):
    """Available time slot."""

    hour: Annotated[int, Field(ge=5, le=23)]
    available: bool
    booking_id: str | None = None
    status: str | None = None  # PENDING, CONFIRMED if booked


class BookingTimelineResponse(BaseModel):
    """Venue availability timeline for a date."""

    venue_id: str
    date: str
    open_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    close_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    slots: list[TimeSlot]


class MerchantBookingStats(BaseModel):
    """Merchant booking statistics."""

    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    completed_bookings: int
    total_revenue: Decimal
