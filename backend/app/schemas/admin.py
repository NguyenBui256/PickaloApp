"""
Admin schemas for request and response.

Pydantic models for admin operations, dashboard metrics, and audit logs.
"""

import uuid
from typing import Annotated
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.user import UserRole
from app.models.admin import ActionType, TargetType


# Dashboard Metrics
class DashboardMetrics(BaseModel):
    """Platform-wide metrics for admin dashboard."""

    total_users: int
    total_merchants: int
    total_venues: int
    total_bookings: int
    active_users: int
    verified_venues: int
    pending_verifications: int
    total_revenue: float | None = None


# User Management
class UserListResponse(BaseModel):
    """Response for paginated user list."""

    users: list["UserListItem"]
    total: int
    page: int
    limit: int


class UserListItem(BaseModel):
    """Compact user representation for admin lists."""

    id: str
    phone: str
    full_name: str
    email: str | None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: str
    venues_count: int = 0
    bookings_count: int = 0

    @field_validator("id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


class BanUserRequest(BaseModel):
    """Request to ban a user."""

    reason: Annotated[
        str,
        Field(
            min_length=10,
            max_length=500,
            description="Reason for banning the user",
        ),
    ]


class UnbanUserRequest(BaseModel):
    """Request to unban a user."""

    reason: Annotated[
        str,
        Field(
            min_length=10,
            max_length=500,
            description="Reason for unbanning the user",
        ),
    ]


class UpdateUserRoleRequest(BaseModel):
    """Request to change user role."""

    role: Annotated[
        UserRole,
        Field(description="New role to assign to user"),
    ]
    reason: Annotated[
        str,
        Field(
            min_length=10,
            max_length=500,
            description="Reason for role change",
        ),
    ]


class CreateUserRequest(BaseModel):
    """Request to create a new user by admin."""

    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    email: str | None = None
    password: str = Field(..., min_length=1)
    role: UserRole = UserRole.USER


# Venue Management
class VenueListResponse(BaseModel):
    """Response for paginated venue list."""

    venues: list["VenueAdminListItem"]
    total: int
    page: int
    limit: int


class VenueAdminListItem(BaseModel):
    """Compact venue representation for admin lists."""

    id: str
    name: str
    merchant_id: str
    merchant_name: str
    address: str
    is_verified: bool
    is_active: bool
    created_at: str
    bookings_count: int = 0

    @field_validator("id", "merchant_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


class VerifyVenueRequest(BaseModel):
    """Request to verify/unverify a venue."""

    verified: Annotated[
        bool,
        Field(description="Verification status to set"),
    ]
    reason: Annotated[
        str,
        Field(
            min_length=10,
            max_length=500,
            description="Reason for verification status change",
        ),
    ]


# Booking Management
class BookingListResponse(BaseModel):
    """Response for paginated booking list."""

    bookings: list["BookingAdminListItem"]
    total: int
    page: int
    limit: int


class BookingAdminListItem(BaseModel):
    """Compact booking representation for admin lists."""

    id: str
    user_id: str
    user_name: str
    venue_id: str
    venue_name: str
    booking_date: str
    start_time: str
    end_time: str
    total_price: float
    status: str
    created_at: str

    @field_validator("id", "user_id", "venue_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    @field_validator("booking_date", "start_time", "end_time", "created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


class BookingAdminDetail(BookingAdminListItem):
    """Detailed booking information for admin."""

    payment_id: str | None = None
    payment_status: str | None = None
    payment_method: str | None = None
    cancellation_reason: str | None = None
    user_phone: str | None = None
    merchant_phone: str | None = None
    notes: str | None = None
    audit_trail: list["AuditLogItem"] = []


class CancelBookingRequest(BaseModel):
    """Request to cancel a booking."""

    reason: Annotated[
        str,
        Field(
            min_length=10,
            max_length=500,
            description="Reason for cancellation",
        ),
    ]


# Content Moderation
class PostListResponse(BaseModel):
    """Response for paginated post list."""

    posts: list["PostAdminListItem"]
    total: int
    page: int
    limit: int


class PostAdminListItem(BaseModel):
    """Compact post representation for admin lists."""

    id: str
    author_id: str
    author_name: str
    content: str
    post_type: str
    status: str
    created_at: str
    comments_count: int = 0

    @field_validator("id", "author_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


class CommentListResponse(BaseModel):
    """Response for paginated comment list."""

    comments: list["CommentAdminListItem"]
    total: int
    page: int
    limit: int


class CommentAdminListItem(BaseModel):
    """Compact comment representation for admin lists."""

    id: str
    post_id: str
    author_id: str
    author_name: str
    content: str
    created_at: str

    @field_validator("id", "post_id", "author_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


# Audit Log
class AuditLogResponse(BaseModel):
    """Response for paginated audit log."""

    actions: list["AuditLogItem"]
    total: int
    page: int
    limit: int


class AuditLogItem(BaseModel):
    """Admin action log entry."""

    id: str
    admin_id: str
    admin_name: str
    action_type: ActionType
    target_type: TargetType | None
    target_id: str | None
    reason: str | None
    created_at: str

    @field_validator("id", "admin_id", "target_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID | None) -> str | None:
        """Convert UUID to string for JSON serialization."""
        if v is None:
            return None
        return str(v)

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime) -> str:
        """Convert datetime to ISO string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


# Report Management
class ReportAdminListItem(BaseModel):
    """User report on content or entity."""

    id: str
    reporter_id: str
    reporter_name: str
    target_type: str  # POST, COMMENT, VENUE, USER
    target_id: str
    reason: str
    description: str | None
    status: str  # PENDING, RESOLVED, DISMISSED
    created_at: str
    resolved_at: str | None = None
    resolver_id: str | None = None

    @field_validator("id", "reporter_id", "target_id", "resolver_id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID | None) -> str | None:
        if v is None:
            return None
        return str(v)

    @field_validator("created_at", "resolved_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: datetime | None) -> str | None:
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    """Response for paginated report list."""

    reports: list[ReportAdminListItem]
    total: int
    page: int
    limit: int


class UpdateVenueStatusRequest(BaseModel):
    """Request to update venue active status."""

    is_active: bool
    reason: str = Field(min_length=10, max_length=500)


# Message Responses
class MessageResponse(BaseModel):
    """Generic success message response."""

    message: str
