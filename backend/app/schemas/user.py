"""
User schemas for request and response.

Pydantic models for user data validation and serialization.
"""

import uuid
from datetime import date
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user fields shared across schemas."""

    full_name: Annotated[
        str,
        Field(
            min_length=2,
            max_length=100,
        ),
    ]
    email: Annotated[EmailStr | None, None] = None
    avatar_url: Annotated[str | None, None] = None
    date_of_birth: Annotated[date | None, None] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""

    phone: Annotated[
        str,
        Field(
            pattern=r"^\+84\d{9}$",
        ),
    ]
    password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=100,
        ),
    ]
    role: Annotated[UserRole, Field(default=UserRole.USER)] = UserRole.USER


class UserUpdate(BaseModel):
    """Schema for updating user profile (all fields optional)."""

    full_name: Annotated[str | None, Field(min_length=2, max_length=100)] = None
    email: Annotated[EmailStr | None, None] = None
    avatar_url: Annotated[str | None, None] = None
    date_of_birth: Annotated[date | None, None] = None


class UserResponse(UserBase):
    """Schema for user response (excluding sensitive data)."""

    id: str
    phone: str
    role: UserRole
    is_active: bool
    is_verified: bool

    @field_validator("id", mode="before")
    @classmethod
    def convert_uuid_to_str(cls, v: uuid.UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(v)

    model_config = {"from_attributes": True}


class UserProfileResponse(UserResponse):
    """Extended user profile response."""

    created_at: str
    updated_at: str
    deleted_at: str | None = None

    @field_validator("created_at", "updated_at", "deleted_at", mode="before")
    @classmethod
    def convert_datetime_to_str(cls, v: date | None) -> str | None:
        """Convert datetime to ISO string for JSON serialization."""
        if v is None:
            return None
        if isinstance(v, date):
            return v.isoformat()
        return str(v)
