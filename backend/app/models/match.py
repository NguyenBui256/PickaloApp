"""
Match models for public matchmaking feature.

Includes:
- Match: Public booking shared for others to join
- MatchRequest: User requests to join a match
"""

import uuid
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text, Numeric, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.user import User


class MatchStatus(str, Enum):
    """Status of a public match."""

    OPEN = "OPEN"        # Looking for players
    FULL = "FULL"        # All slots taken
    CANCELLED = "CANCELLED" # Match cancelled
    CLOSED = "CLOSED"    # Manually closed


class MatchSkillLevel(str, Enum):
    """Expected skill level for the match."""

    ALL = "ALL"          # Anyone can join
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class MatchRequestStatus(str, Enum):
    """Status of a user's request to join."""

    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class Match(BaseModel):
    """
    Public match created from an existing booking.
    """

    __tablename__ = "matches"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    
    slots_needed: Mapped[int] = mapped_column(Integer, nullable=False)
    slots_filled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price_per_slot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    skill_level: Mapped[MatchSkillLevel] = mapped_column(
        String(20), default=MatchSkillLevel.ALL, nullable=False
    )
    status: Mapped[MatchStatus] = mapped_column(
        String(20), default=MatchStatus.OPEN, nullable=False, index=True
    )
    
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    booking: Mapped["Booking"] = relationship(
        "Booking", back_populates="match", lazy="selectin"
    )
    requests: Mapped[list["MatchRequest"]] = relationship(
        "MatchRequest", back_populates="match", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def is_open(self) -> bool:
        return self.status == MatchStatus.OPEN

    @property
    def available_slots(self) -> int:
        return max(0, self.slots_needed - self.slots_filled)


class MatchRequest(BaseModel):
    """
    A user's application to join a public match.
    """

    __tablename__ = "match_requests"

    match_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requester_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    member_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[MatchRequestStatus] = mapped_column(
        String(20), default=MatchRequestStatus.PENDING, nullable=False, index=True
    )

    # Relationships
    match: Mapped["Match"] = relationship(
        "Match", back_populates="requests"
    )
    requester: Mapped["User"] = relationship(
        "User", lazy="selectin"
    )
    chat_room: Mapped["ChatRoom"] = relationship(
        "ChatRoom", back_populates="match_request", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def chat_room_id(self) -> uuid.UUID | None:
        return self.chat_room.id if self.chat_room else None
