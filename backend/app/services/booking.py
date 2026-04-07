"""
Booking business logic service.

Handles booking CRUD, availability checking, state transitions,
and merchant approval/rejection workflows.
"""

import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, BookingStatus, BookingService
from app.models.venue import Venue, VenueService
from app.models.user import User
from app.services.pricing import PricingService


class BookingService:
    """
    Service for booking management operations.

    Methods:
        check_availability: Check if time slot is available
        create_booking: Create new booking with price calculation
        get_user_bookings: List user's bookings with filters
        get_booking_by_id: Get booking with ownership check
        cancel_booking: Cancel booking (user or merchant)
        approve_booking: Merchant approves pending booking
        reject_booking: Merchant rejects pending booking
        get_venue_bookings: Get bookings for a venue
        get_merchant_bookings: Get all bookings for merchant's venues
        get_timeline_availability: Get hourly slots for a date
        expire_pending_bookings: Mark unpaid bookings as expired
    """

    def __init__(self, session: AsyncSession):
        """Initialize booking service with database session."""
        self.session = session

    async def check_availability(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
        exclude_booking_id: uuid.UUID | None = None,
    ) -> bool:
        """
        Check if time slot is available for booking.

        Args:
            venue_id: Venue UUID
            booking_date: Date to check
            start_time: Start time (HH:MM format)
            end_time: End time (HH:MM format)
            exclude_booking_id: Exclude this booking (for updates)

        Returns:
            True if slot is available

        Raises:
            ValueError: If time range is invalid
        """
        # Parse times
        try:
            start = datetime.strptime(start_time, "%H:%M").time()
            end = datetime.strptime(end_time, "%H:%M").time()
        except ValueError as e:
            raise ValueError(f"Invalid time format: {e}")

        if end <= start:
            raise ValueError("end_time must be after start_time")

        # Find overlapping active bookings
        # Overlap condition: (StartA < EndB) and (EndA > StartB)
        conditions = [
            Booking.venue_id == venue_id,
            Booking.booking_date == booking_date,
            Booking.status.in_([
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
            ]),
            Booking.start_time < end,
            Booking.end_time > start,
        ]

        if exclude_booking_id:
            conditions.append(Booking.id != exclude_booking_id)

        result = await self.session.execute(
            select(func.count()).select_from(Booking).where(and_(*conditions))
        )
        conflict_count = result.scalar()

        return conflict_count == 0

    async def create_booking(
        self,
        user_id: uuid.UUID,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
        pricing_result: dict[str, Any],
        services: list[dict] | None = None,
        notes: str | None = None,
    ) -> Booking:
        """
        Create a new booking.

        Args:
            user_id: User making the booking
            venue_id: Venue to book
            booking_date: Date of booking
            start_time: Start time (HH:MM)
            end_time: End time (HH:MM)
            pricing_result: Price calculation from PricingService
            services: Optional list of service dicts
            notes: Optional special requests

        Returns:
            Created booking instance

        Raises:
            ValueError: If slot not available or invalid input
        """
        # Check availability
        available = await self.check_availability(
            venue_id, booking_date, start_time, end_time
        )

        if not available:
            raise ValueError("Time slot is not available")

        # Parse times
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()
        duration_minutes = int((datetime.combine(date.today(), end) -
                                datetime.combine(date.today(), start)).total_seconds() / 60)

        # Extract pricing data
        venue_pricing = pricing_result["venue_pricing"]

        # Create booking
        booking = Booking(
            user_id=user_id,
            venue_id=venue_id,
            booking_date=booking_date,
            start_time=start,
            end_time=end,
            duration_minutes=duration_minutes,
            base_price=venue_pricing["base_price"],
            price_factor=venue_pricing["price_factor"],
            service_fee=venue_pricing["service_fee"],
            total_price=pricing_result["total"],
            status=BookingStatus.PENDING,
            notes=notes,
        )

        self.session.add(booking)
        await self.session.flush()

        # Add services if provided
        if services:
            for service_data in services:
                booking_service = BookingService(
                    booking_id=booking.id,
                    service_id=service_data["service_id"],
                    quantity=service_data["quantity"],
                    price_per_unit=service_data["unit_price"],
                    status="PENDING",
                )
                self.session.add(booking_service)

        await self.session.flush()
        return booking

    async def get_user_bookings(
        self,
        user_id: uuid.UUID,
        status: BookingStatus | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Booking], int]:
        """
        Get user's bookings with optional filters.

        Args:
            user_id: User UUID
            status: Filter by status
            date_from: Filter by date range start
            date_to: Filter by date range end
            skip: Pagination offset
            limit: Results per page

        Returns:
            Tuple of (bookings list, total count)
        """
        conditions = [Booking.user_id == user_id]

        if status:
            conditions.append(Booking.status == status)
        if date_from:
            conditions.append(Booking.booking_date >= date_from)
        if date_to:
            conditions.append(Booking.booking_date <= date_to)

        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(Booking).where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get bookings with relations
        result = await self.session.execute(
            select(Booking)
            .options(
                selectinload(Booking.venue),
                selectinload(Booking.booking_services),
            )
            .where(and_(*conditions))
            .order_by(Booking.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        bookings = list(result.scalars().all())

        return bookings, total

    async def get_booking_by_id(
        self,
        booking_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        merchant_id: uuid.UUID | None = None,
    ) -> Booking | None:
        """
        Get booking by ID with ownership verification.

        Args:
            booking_id: Booking UUID
            user_id: Optional user ID (for user bookings)
            merchant_id: Optional merchant ID (for merchant bookings)

        Returns:
            Booking instance or None if not found/not authorized

        Raises:
            ValueError: If neither user_id nor merchant_id provided
        """
        if not user_id and not merchant_id:
            raise ValueError("Must provide either user_id or merchant_id")

        result = await self.session.execute(
            select(Booking)
            .options(
                selectinload(Booking.user),
                selectinload(Booking.venue),
                selectinload(Booking.booking_services),
            )
            .where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()

        if not booking:
            return None

        # Check authorization
        if user_id and booking.user_id != user_id:
            return None

        if merchant_id and booking.venue.merchant_id != merchant_id:
            return None

        return booking

    async def cancel_booking(
        self,
        booking_id: uuid.UUID,
        user_id: uuid.UUID,
        cancelled_by: str = "USER",
        reason: str | None = None,
    ) -> Booking:
        """
        Cancel a booking.

        Args:
            booking_id: Booking UUID
            user_id: User cancelling the booking
            cancelled_by: Who is cancelling (USER, MERCHANT, ADMIN)
            reason: Optional cancellation reason

        Returns:
            Updated booking

        Raises:
            ValueError: If booking not found, not authorized, or cannot be cancelled
        """
        booking = await self.get_booking_by_id(booking_id, user_id=user_id)

        if not booking:
            raise ValueError("Booking not found")

        if not booking.is_cancelable:
            raise ValueError(
                f"Booking cannot be cancelled (current status: {booking.status.value})"
            )

        booking.cancel(cancelled_by)

        # Add reason to notes if provided
        if reason:
            note_prefix = booking.notes or ""
            booking.notes = f"{note_prefix}\n\nCancelled: {reason}".strip()

        await self.session.flush()
        return booking

    async def approve_booking(
        self,
        booking_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> Booking:
        """
        Merchant approves a pending booking.

        Args:
            booking_id: Booking UUID
            merchant_id: Merchant approving the booking

        Returns:
            Updated booking

        Raises:
            ValueError: If booking not found, not authorized, or cannot be approved
        """
        booking = await self.get_booking_by_id(booking_id, merchant_id=merchant_id)

        if not booking:
            raise ValueError("Booking not found")

        if not booking.can_be_approved:
            raise ValueError(
                f"Booking cannot be approved (status: {booking.status.value}, paid: {booking.is_paid})"
            )

        booking.approve()
        await self.session.flush()
        return booking

    async def reject_booking(
        self,
        booking_id: uuid.UUID,
        merchant_id: uuid.UUID,
        reason: str | None = None,
    ) -> Booking:
        """
        Merchant rejects a pending booking.

        Args:
            booking_id: Booking UUID
            merchant_id: Merchant rejecting the booking
            reason: Optional rejection reason

        Returns:
            Updated booking

        Raises:
            ValueError: If booking not found, not authorized, or cannot be rejected
        """
        booking = await self.get_booking_by_id(booking_id, merchant_id=merchant_id)

        if not booking:
            raise ValueError("Booking not found")

        if booking.status != BookingStatus.PENDING:
            raise ValueError(
                f"Cannot reject booking with status: {booking.status.value}"
            )

        # Reject by cancelling with merchant as cancelled_by
        booking.cancel("MERCHANT")

        if reason:
            note_prefix = booking.notes or ""
            booking.notes = f"{note_prefix}\n\nRejected: {reason}".strip()

        await self.session.flush()
        return booking

    async def get_venue_bookings(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        booking_date: date | None = None,
        status: BookingStatus | None = None,
    ) -> list[Booking]:
        """
        Get bookings for a specific venue.

        Args:
            venue_id: Venue UUID
            merchant_id: Merchant ID (for ownership verification)
            booking_date: Optional date filter
            status: Optional status filter

        Returns:
            List of bookings

        Raises:
            ValueError: If venue not owned by merchant
        """
        # Verify venue ownership
        venue_result = await self.session.execute(
            select(Venue).where(Venue.id == venue_id)
        )
        venue = venue_result.scalar_one_or_none()

        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Venue not found or access denied")

        # Build conditions
        conditions = [Booking.venue_id == venue_id]

        if booking_date:
            conditions.append(Booking.booking_date == booking_date)
        if status:
            conditions.append(Booking.status == status)

        result = await self.session.execute(
            select(Booking)
            .options(
                selectinload(Booking.user),
                selectinload(Booking.booking_services),
            )
            .where(and_(*conditions))
            .order_by(Booking.booking_date, Booking.start_time)
        )
        return list(result.scalars().all())

    async def get_merchant_bookings(
        self,
        merchant_id: uuid.UUID,
        status: BookingStatus | None = None,
        venue_id: uuid.UUID | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Booking], int]:
        """
        Get all bookings across merchant's venues.

        Args:
            merchant_id: Merchant UUID
            status: Optional status filter
            venue_id: Optional venue filter
            date_from: Optional date range start
            date_to: Optional date range end
            skip: Pagination offset
            limit: Results per page

        Returns:
            Tuple of (bookings list, total count)
        """
        # Get merchant's venue IDs
        venue_result = await self.session.execute(
            select(Venue.id).where(Venue.merchant_id == merchant_id)
        )
        venue_ids = [row[0] for row in venue_result.all()]

        if not venue_ids:
            return [], 0

        # Build conditions
        conditions = [Booking.venue_id.in_(venue_ids)]

        if status:
            conditions.append(Booking.status == status)
        if venue_id:
            conditions.append(Booking.venue_id == venue_id)
        if date_from:
            conditions.append(Booking.booking_date >= date_from)
        if date_to:
            conditions.append(Booking.booking_date <= date_to)

        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(Booking).where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get bookings
        result = await self.session.execute(
            select(Booking)
            .options(
                selectinload(Booking.venue),
                selectinload(Booking.user),
                selectinload(Booking.booking_services),
            )
            .where(and_(*conditions))
            .order_by(Booking.booking_date.desc(), Booking.start_time.desc())
            .offset(skip)
            .limit(limit)
        )
        bookings = list(result.scalars().all())

        return bookings, total

    async def get_timeline_availability(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
    ) -> dict[str, Any]:
        """
        Get hourly availability timeline for a venue on a date.

        Args:
            venue_id: Venue UUID
            booking_date: Date to check

        Returns:
            Dict with venue_id, date, open_time, close_time, slots (hourly)
        """
        # Get venue
        venue_result = await self.session.execute(
            select(Venue).where(Venue.id == venue_id)
        )
        venue = venue_result.scalar_one_or_none()

        if not venue:
            raise ValueError("Venue not found")

        # Get operating hours
        hours = venue.operating_hours or {}
        open_time = hours.get("open", "05:00")
        close_time = hours.get("close", "23:00")

        open_hour = int(open_time.split(":")[0])
        close_hour = int(close_time.split(":")[0])

        # Get bookings for the date
        start_of_day = datetime.combine(booking_date, time.min)
        end_of_day = datetime.combine(booking_date, time.max)

        booking_result = await self.session.execute(
            select(Booking).where(
                Booking.venue_id == venue_id,
                Booking.booking_date == booking_date,
                Booking.status.in_([
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                ]),
            )
        )
        bookings = list(booking_result.scalars().all())

        # Generate hourly slots
        slots = []
        for hour in range(open_hour, close_hour):
            slot_start = datetime.combine(booking_date, time(hour=hour))
            slot_end = datetime.combine(booking_date, time(hour=hour + 1))

            # Check if slot is booked
            booked = None
            for booking in bookings:
                booking_start = datetime.combine(booking_date, booking.start_time)
                booking_end = datetime.combine(booking_date, booking.end_time)

                # Check overlap
                if booking_start < slot_end and booking_end > slot_start:
                    booked = booking
                    break

            slots.append({
                "hour": hour,
                "available": booked is None,
                "booking_id": str(booked.id) if booked else None,
                "status": booked.status.value if booked else None,
            })

        return {
            "venue_id": str(venue_id),
            "date": booking_date.isoformat(),
            "open_time": open_time,
            "close_time": close_time,
            "slots": slots,
        }

    async def expire_pending_bookings(self, timeout_minutes: int = 15) -> int:
        """
        Mark pending bookings as expired if unpaid beyond timeout.

        Args:
            timeout_minutes: Payment timeout in minutes (default: 15)

        Returns:
            Number of bookings expired
        """
        cutoff = datetime.now() - timedelta(minutes=timeout_minutes)

        result = await self.session.execute(
            select(Booking).where(
                Booking.status == BookingStatus.PENDING,
                Booking.paid_at.is_(None),
                Booking.created_at < cutoff,
            )
        )
        bookings = list(result.scalars().all())

        count = 0
        for booking in bookings:
            booking.expire()
            count += 1

        await self.session.flush()
        return count


async def get_booking_service(session: AsyncSession) -> BookingService:
    """
    Dependency to get booking service instance.

    Args:
        session: Database session

    Returns:
        BookingService instance
    """
    return BookingService(session)
