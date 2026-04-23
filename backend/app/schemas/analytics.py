"""
Analytics schemas for request and response.

Pydantic models for analytics data including revenue trends,
booking statistics, user growth, and venue performance.
"""

import uuid
from typing import Annotated
from datetime import date

from pydantic import BaseModel, Field, field_validator


# Revenue Analytics
class RevenueTrendResponse(BaseModel):
    """Response for revenue trend analytics."""

    period: str  # "daily", "weekly", "monthly"
    start_date: str
    end_date: str
    total_revenue: float
    data_points: list["RevenueDataPoint"]


class RevenueDataPoint(BaseModel):
    """Single data point in revenue trend."""

    date: str
    revenue: float
    booking_count: int


# Booking Analytics
class BookingStatsResponse(BaseModel):
    """Response for booking statistics."""

    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    completion_rate: float
    average_booking_value: float
    popular_time_slots: list["TimeSlotStats"]
    daily_breakdown: list["DailyBookingStats"]


class TimeSlotStats(BaseModel):
    """Statistics for a time slot."""

    hour: int
    booking_count: int
    utilization_rate: float


class DailyBookingStats(BaseModel):
    """Daily booking statistics."""

    date: str
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    revenue: float


# User Analytics
class UserGrowthResponse(BaseModel):
    """Response for user growth analytics."""

    total_users: int
    new_users_this_period: int
    active_users_this_period: int
    growth_rate: float
    user_breakdown: dict[str, int]  # role -> count
    daily_signups: list["DailySignupStats"]


class DailySignupStats(BaseModel):
    """Daily user signup statistics."""

    date: str
    new_users: int
    new_merchants: int


# Venue Analytics
class VenuePerformanceResponse(BaseModel):
    """Response for venue performance analytics."""

    total_venues: int
    active_venues: int
    verified_venues: int
    top_performing_venues: list["VenuePerformanceItem"]
    venue_type_breakdown: dict[str, int]


class VenuePerformanceItem(BaseModel):
    """Performance metrics for a single venue."""

    venue_id: str
    venue_name: str
    merchant_name: str
    total_bookings: int
    total_revenue: float
    average_rating: float | None = None
    verification_status: bool

    @field_validator("venue_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    model_config = {"from_attributes": True}


# Analytics Period
class AnalyticsPeriod(BaseModel):
    """Analytics time period specification."""

    start_date: Annotated[
        date,
        Field(description="Start date for analytics period"),
    ]
    end_date: Annotated[
        date,
        Field(description="End date for analytics period"),
    ]
    period_type: Annotated[
        str,
        Field(description="Period granularity: daily, weekly, monthly"),
    ] = "daily"
