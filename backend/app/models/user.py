"""
User model with role-based access control.

Supports three user types:
- USER: Regular players who book venues
- MERCHANT: Venue owners who manage bookings
- ADMIN: Platform administrators
"""

import uuid
from datetime import date
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text, Boolean, Date, Enum as sqlalchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.venue import Venue
    from app.models.booking import Booking
    from app.models.post import Post, Comment
    from app.models.admin import AdminAction


class UserRole(str, Enum):
    """User role enumeration for access control."""

    USER = "USER"
    MERCHANT = "MERCHANT"
    ADMIN = "ADMIN"


class User(BaseModel):
    """
    User account model.

    Attributes:
        phone: Unique phone number (primary contact for Vietnam)
        email: Optional email address
        password_hash: Bcrypt hashed password
        full_name: User's display name
        role: Access level (USER/MERCHANT/ADMIN)
        is_active: Account status flag
        is_verified: Phone verification status
        avatar_url: Profile image URL
        date_of_birth: Optional birth date
    """

    # Contact information
    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    # Authentication
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Profile
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    avatar_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    # Role and status
    role: Mapped[UserRole] = mapped_column(
        sqlalchemyEnum(UserRole, native_enum=False),
        default=UserRole.USER,
        nullable=False,
        index=True,
    )
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

    # Relationships
    venues: Mapped[list["Venue"]] = relationship(
        "Venue",
        back_populates="merchant",
        lazy="selectin",
    )
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking",
        back_populates="user",
        lazy="selectin",
        foreign_keys="Booking.user_id",
    )
    posts: Mapped[list["Post"]] = relationship(
        "Post",
        back_populates="author",
        lazy="selectin",
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="author",
        lazy="selectin",
    )

    # Admin relationships
    admin_actions: Mapped[list["AdminAction"]] = relationship(
        "AdminAction",
        back_populates="admin",
        foreign_keys="AdminAction.admin_id",
        lazy="selectin",
    )

    @property
    def is_merchant(self) -> bool:
        """Check if user is a merchant."""
        return self.role == UserRole.MERCHANT

    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN

    def can_manage_venue(self, venue_id: uuid.UUID) -> bool:
        """
        Check if user can manage a specific venue.

        Args:
            venue_id: Venue to check permission for

        Returns:
            True if user is admin or merchant of this venue
        """
        if self.is_admin:
            return True
        if self.is_merchant:
            return any(v.id == venue_id for v in self.venues)
        return False

    def to_dict(self, include_sensitive: bool = False) -> dict[str, Any]:
        """
        Convert user to dictionary.

        Args:
            include_sensitive: Include password_hash in output

        Returns:
            Dictionary representation
        """
        data = super().to_dict()
        if not include_sensitive:
            data.pop("password_hash", None)
        return data

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"User(id={self.id!r}, phone={self.phone!r}, role={self.role.value})"
