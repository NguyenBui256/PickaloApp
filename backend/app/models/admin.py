"""
Admin action model for audit logging.

Tracks all administrative actions for:
- Compliance and security
- Dispute resolution
- Platform analytics
"""

import uuid
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class ActionType(str, Enum):
    """Types of administrative actions."""

    BAN_USER = "BAN_USER"
    UNBAN_USER = "UNBAN_USER"
    DELETE_POST = "DELETE_POST"
    HIDE_POST = "HIDE_POST"
    VERIFY_VENUE = "VERIFY_VENUE"
    UNVERIFY_VENUE = "UNVERIFY_VENUE"
    CANCEL_BOOKING = "CANCEL_BOOKING"
    REFUND_PAYMENT = "REFUND_PAYMENT"
    UPDATE_USER_ROLE = "UPDATE_USER_ROLE"
    UPDATE_VENUE_STATUS = "UPDATE_VENUE_STATUS"
    CREATE_USER = "CREATE_USER"


class TargetType(str, Enum):
    """Entity types that admin actions can target."""

    USER = "USER"
    POST = "POST"
    VENUE = "VENUE"
    BOOKING = "BOOKING"
    PAYMENT = "PAYMENT"
    COMMENT = "COMMENT"


class AdminAction(BaseModel):
    """
    Audit log entry for administrative actions.

    Attributes:
        admin_id: Administrator who performed the action
        action_type: Category of action performed
        target_type: Type of entity affected
        target_id: ID of affected entity
        reason: Explanation for the action
    """

    __tablename__ = "admin_actions"

    # Who performed the action
    admin_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # What was done
    action_type: Mapped[ActionType] = mapped_column(
        String(50),
        nullable=False,
    )

    # What was affected
    target_type: Mapped[TargetType | None] = mapped_column(
        String(50),
        nullable=True,
    )
    target_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True,
    )

    # Why it was done
    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationship
    admin: Mapped["User"] = relationship(
        "User",
        back_populates="admin_actions",
        lazy="selectin",
        foreign_keys=[admin_id],
    )

    @property
    def admin_name(self) -> str:
        """Get admin's full name."""
        return self.admin.full_name if self.admin else "System"

    @property
    def is_ban_action(self) -> bool:
        """Check if this is a user ban action."""
        return self.action_type == ActionType.BAN_USER

    @property
    def is_delete_action(self) -> bool:
        """Check if this is a content deletion action."""
        return self.action_type in (ActionType.DELETE_POST, ActionType.HIDE_POST)

    @property
    def is_verification_action(self) -> bool:
        """Check if this is a venue verification action."""
        return self.action_type in (
            ActionType.VERIFY_VENUE,
            ActionType.UNVERIFY_VENUE,
        )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"AdminAction(id={self.id!r}, action={self.action_type.value}, "
            f"target={self.target_type.value if self.target_type else None})"
        )
