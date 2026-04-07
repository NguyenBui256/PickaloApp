"""
Authentication and authorization schemas.

Request/response schemas for auth endpoints.
"""

from typing import Annotated, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserResponse
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    phone: Annotated[
        str,
        Field(
            pattern=r"^\+84\d{9}$",
            description="Vietnamese phone number: +84 followed by 9 digits",
        ),
    ]
    password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=16,
            description="Password (8-16 characters)",
        ),
    ]
    full_name: Annotated[
        str,
        Field(
            min_length=2,
            max_length=100,
            description="User's full name",
        ),
    ]
    email: Annotated[EmailStr | None, Field(default=None)] = None
    role: Annotated[UserRole, Field(default=UserRole.USER)] = UserRole.USER

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """Request schema for user login."""

    phone: Annotated[
        str,
        Field(
            pattern=r"^\+84\d{9}$",
            description="Vietnamese phone number",
        ),
    ]
    password: Annotated[str, Field(min_length=1, description="User password")]


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: Annotated[
        str,
        Field(
            min_length=1,
            description="Valid refresh token",
        ),
    ]


class TokenResponse(BaseModel):
    """Response schema with access token."""

    access_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int  # seconds


class AuthResponse(TokenResponse):
    """Response schema for login/register with user data."""

    refresh_token: str
    user: UserResponse


class VerifyPhoneRequest(BaseModel):
    """Request schema for phone verification (OTP placeholder)."""

    phone: Annotated[
        str,
        Field(
            pattern=r"^\+84\d{9}$",
            description="Vietnamese phone number to verify",
        ),
    ]
    otp: Annotated[
        str,
        Field(
            pattern=r"^\d{6}$",
            description="6-digit OTP code",
        ),
    ]


class ChangePasswordRequest(BaseModel):
    """Request schema for password change."""

    old_password: Annotated[str, Field(min_length=1)]
    new_password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=16,
            description="New password (8-16 characters)",
        ),
    ]

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate new password meets security requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
