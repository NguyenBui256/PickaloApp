"""
Booking models for venue reservations.

Includes:
- Booking: Main booking record with pricing and status
- BookingService: Junction table for booked add-on services
"""

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text, Numeric, Integer, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.venue import Venue
    from app.models.venue_services import VenueService
    from app.models.court import Court
    from app.models.match import Match


class BookingStatus(str, Enum):
    """Booking status enumeration."""

    PENDING = "PENDING"  # Created by user, awaiting merchant approval
    CONFIRMED = "CONFIRMED"  # Approved by merchant
    CANCELLED = "CANCELLED"  # Cancelled by user, merchant, or admin
    COMPLETED = "COMPLETED"  # Booking time has passed
    EXPIRED = "EXPIRED"  # Payment timeout (15 minutes)


class Booking(BaseModel):
    """
    Venue booking record.

    Attributes:
        user_id: Customer who made the booking
        venue_id: Venue being booked
        booking_date: Reference date for the booking
        total_price: Final price (aggregated from slots and services)
        status: Current booking state
        payment_method: Payment gateway used
        payment_id: Transaction ID from payment provider
        paid_at: Payment completion timestamp
        notes: Special requests or notes
        cancelled_at: Timestamp of cancellation
        cancelled_by: Who cancelled (USER, MERCHANT, ADMIN)
    """

    # Relationships
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    venue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Schedule information moved to BookingSlot
    # We keep booking_date in Booking as a reference for the primary day of booking
    booking_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    # Pricing (Total aggregated from slots)
    total_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Status
    status: Mapped[BookingStatus] = mapped_column(
        String(20),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Payment
    payment_method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    payment_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    payment_proof: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Additional info
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Cancellation tracking
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancelled_by: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="bookings",
        lazy="selectin",
        foreign_keys=[user_id],
    )
    venue: Mapped["Venue"] = relationship(
        "Venue",
        back_populates="bookings",
        lazy="selectin",
    )
    slots: Mapped[list["BookingSlot"]] = relationship(
        "BookingSlot",
        back_populates="booking",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    booking_services: Mapped[list["BookingService"]] = relationship(
        "BookingService",
        back_populates="booking",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    match: Mapped["Match"] = relationship(
        "Match",
        back_populates="booking",
        lazy="selectin",
        uselist=False,
    )

    @property
    def is_paid(self) -> bool:
        """Check if booking has been paid."""
        return self.paid_at is not None

    @property
    def is_cancelable(self) -> bool:
        """Check if booking can be cancelled."""
        return self.status in (BookingStatus.PENDING, BookingStatus.CONFIRMED)

    @property
    def is_active(self) -> bool:
        """Check if booking is still active (not cancelled/completed/expired)."""
        return self.status in (BookingStatus.PENDING, BookingStatus.CONFIRMED)

    @property
    def user_name(self) -> str:
        """Get customer's full name."""
        return self.user.full_name if self.user else "N/A"

    @property
    def venue_name(self) -> str:
        """Get venue name."""
        return self.venue.name if self.venue else "N/A"

    @property
    def start_time(self) -> Any:
        """Get earliest start time from slots."""
        if not self.slots:
            return None
        return min(slot.start_time for slot in self.slots)

    @property
    def end_time(self) -> Any:
        """Get latest end time from slots."""
        if not self.slots:
            return None
        return max(slot.end_time for slot in self.slots)

    @property
    def can_be_approved(self) -> bool:
        """Check if merchant can approve this booking."""
        return self.status == BookingStatus.PENDING and self.is_paid

    @property
    def can_be_completed(self) -> bool:
        """Check if booking can be marked as completed."""
        return self.status == BookingStatus.CONFIRMED

    def approve(self) -> None:
        """Approve the booking (merchant action)."""
        if not self.can_be_approved:
            raise ValueError("Booking cannot be approved")
        self.status = BookingStatus.CONFIRMED

    def complete(self) -> None:
        """Mark the booking as completed (merchant action)."""
        if not self.can_be_completed:
            raise ValueError("Booking cannot be completed")
        self.status = BookingStatus.COMPLETED

    def cancel(self, cancelled_by: str) -> None:
        """
        Cancel the booking.

        Args:
            cancelled_by: Who is cancelling (USER, MERCHANT, ADMIN)
        """
        if not self.is_cancelable:
            raise ValueError("Booking cannot be cancelled")
        self.status = BookingStatus.CANCELLED
        self.cancelled_at = datetime.now()
        self.cancelled_by = cancelled_by

    def complete(self) -> None:
        """Mark booking as completed (after the time has passed)."""
        if self.status != BookingStatus.CONFIRMED:
            raise ValueError("Only confirmed bookings can be completed")
        self.status = BookingStatus.COMPLETED

    def expire(self) -> None:
        """Mark booking as expired (payment timeout)."""
        if self.status != BookingStatus.PENDING:
            raise ValueError("Only pending bookings can be expired")
        self.status = BookingStatus.EXPIRED

    def to_dict(self) -> dict[str, Any]:
        """Convert booking to dictionary."""
        data = super().to_dict()
        # Add computed properties
        data["is_paid"] = self.is_paid
        data["is_cancelable"] = self.is_cancelable
        data["is_active"] = self.is_active
        return data

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"Booking(id={self.id!r}, status={self.status.value}, "
            f"venue_id={self.venue_id!r}, date={self.booking_date})"
        )


class BookingSlot(BaseModel):
    """
    Individual court time slot within a booking.
    """
    __tablename__ = "booking_slots"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    court_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    booking_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )
    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="slots")
    court: Mapped["Court"] = relationship("Court", back_populates="booking_slots")

    def __repr__(self) -> str:
        return (
            f"BookingSlot(id={self.id!r}, court_id={self.court_id!r}, "
            f"time={self.start_time}-{self.end_time})"
        )


class BookingService(BaseModel):
    """
    Junction table linking bookings to additional services.

    Allows tracking which services were booked with quantity and price.
    """

    __tablename__ = "booking_services"

    # Relationships
    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venue_services.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Service details at booking time (price may change later)
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    price_per_unit: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Status (in case service becomes unavailable)
    status: Mapped[str] = mapped_column(
        String(20),
        default="PENDING",
        nullable=False,
    )

    # Relationships
    booking: Mapped["Booking"] = relationship(
        "Booking",
        back_populates="booking_services",
        lazy="selectin",
    )

    @property
    def total_price(self) -> Decimal:
        """Calculate total price for this service booking."""
        return self.price_per_unit * Decimal(self.quantity)

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"BookingService(id={self.id!r}, service_id={self.service_id!r}, "
            f"quantity={self.quantity})"
        )
