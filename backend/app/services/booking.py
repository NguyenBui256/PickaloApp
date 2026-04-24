"""
Booking business logic service.

Handles booking CRUD, availability checking, state transitions,
and merchant approval/rejection workflows.
"""

import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.booking import Booking, BookingStatus, BookingService, BookingSlot
from app.models.venue import Venue, VenueService
from app.models.court import Court
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

    @staticmethod
    def _parse_time(time_str: str) -> time:
        """Helper to parse time strings, handling special case '24:00'."""
        if time_str == "24:00":
            return time(23, 59, 59)
        try:
            return datetime.strptime(time_str, "%H:%M").time()
        except ValueError:
            # Try ISO format if strptime fails
            try:
                return time.fromisoformat(time_str)
            except ValueError:
                if len(time_str.split(':')) == 2:
                    return time.fromisoformat(f"{time_str}:00")
                raise

    async def check_availability(
        self,
        court_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
        exclude_booking_id: uuid.UUID | None = None,
    ) -> bool:
        """
        Check if time slot is available for a specific court.
        """
        try:
            start = self._parse_time(start_time)
            end = self._parse_time(end_time)
        except ValueError as e:
            raise ValueError(f"Invalid time format: {e}")

        if end <= start:
            raise ValueError("end_time must be after start_time")

        # Find overlapping slots in active bookings
        conditions = [
            BookingSlot.court_id == court_id,
            BookingSlot.booking_date == booking_date,
            Booking.status.in_([
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
            ]),
            BookingSlot.start_time < end,
            BookingSlot.end_time > start,
        ]

        if exclude_booking_id:
            conditions.append(BookingSlot.booking_id != exclude_booking_id)

        result = await self.session.execute(
            select(func.count())
            .select_from(BookingSlot)
            .join(Booking)
            .where(and_(*conditions))
        )
        conflict_count = result.scalar()

        return conflict_count == 0

    async def create_booking(
        self,
        user_id: uuid.UUID,
        venue_id: uuid.UUID,
        booking_date: date,
        slots_data: list[dict[str, Any]],  # List of {court_id, start_time, end_time, price}
        total_price: Decimal,
        services: list[dict] | None = None,
        notes: str | None = None,
        payment_proof: str | None = None,
    ) -> Booking:
        """
        Create a new booking with multiple slots.
        """
        # 1. Validate all slots concurrently or sequentially
        for slot in slots_data:
            available = await self.check_availability(
                slot["court_id"], 
                booking_date, 
                slot["start_time"], 
                slot["end_time"]
            )
            if not available:
                raise ValueError(f"Slot {slot['start_time']}-{slot['end_time']} on court {slot['court_id']} is not available")

        # 2. Create the master booking
        booking = Booking(
            user_id=user_id,
            venue_id=venue_id,
            booking_date=booking_date,
            total_price=total_price,
            status=BookingStatus.PENDING,
            notes=notes,
            payment_proof=payment_proof,
            paid_at=datetime.now() if payment_proof else None,
        )

        self.session.add(booking)
        await self.session.flush()

        for slot in slots_data:
            start = self._parse_time(slot["start_time"])
            end = self._parse_time(slot["end_time"])
            
            booking_slot = BookingSlot(
                booking_id=booking.id,
                court_id=slot["court_id"],
                booking_date=booking_date,
                start_time=start,
                end_time=end,
                price=slot["price"],
            )
            self.session.add(booking_slot)

        # 4. Add services if provided
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
                selectinload(Booking.slots).selectinload(BookingSlot.court),
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
                f"Booking cannot be cancelled (current status: {booking.status})"
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
                f"Booking cannot be approved (status: {booking.status}, paid: {booking.is_paid})"
            )

        booking.approve()
        await self.session.flush()
        return booking

    async def complete_booking(
        self,
        booking_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> Booking:
        """
        Merchant marks a confirmed booking as completed.
        """
        booking = await self.get_booking_by_id(booking_id, merchant_id=merchant_id)

        if not booking:
            raise ValueError("Booking not found")

        try:
            booking.complete()
            await self.session.flush()
            return booking
        except ValueError as e:
            raise ValueError(str(e))

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
                f"Cannot reject booking with status: {booking.status}"
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
                selectinload(Booking.slots).selectinload(BookingSlot.court),
            )
            .where(and_(*conditions))
            .order_by(Booking.booking_date, Booking.created_at)
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
                selectinload(Booking.slots).selectinload(BookingSlot.court),
            )
            .where(and_(*conditions))
            .order_by(Booking.booking_date.desc(), Booking.created_at.desc())
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
        Get availability grid grouped by court.
        """
        # 1. Get venue and its courts
        venue_result = await self.session.execute(
            select(Venue)
            .options(selectinload(Venue.courts))
            .where(Venue.id == venue_id)
        )
        venue = venue_result.scalar_one_or_none()
        if not venue:
            raise ValueError("Venue not found")

        # 2. Get operating hours
        hours = venue.operating_hours or {}
        open_time_str = hours.get("open", "05:00")
        close_time_str = hours.get("close", "23:00")
        
        # 3. Get bookings for the date (to check availability)
        booking_result = await self.session.execute(
            select(BookingSlot)
            .join(Booking)
            .where(
                Booking.venue_id == venue_id,
                BookingSlot.booking_date == booking_date,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
            )
        )
        existing_slots = list(booking_result.scalars().all())

        # 4. Prepare pricing service
        pricing_service = PricingService(self.session)

        # 5. Build grid
        open_hour = int(open_time_str.split(":")[0])
        close_hour = int(close_time_str.split(":")[0])
        
        courts_data = []
        for court in venue.courts:
            if not court.is_active:
                continue
                
            court_slots = []
            # Generate 30-min or 60-min slots. For now, let's keep it hourly as per old form
            for hour in range(open_hour, close_hour):
                start_t = f"{hour:02d}:00"
                end_t = f"{hour + 1:02d}:00"
                
                # Check if this court is booked at this time
                is_available = True
                for booked_slot in existing_slots:
                    if booked_slot.court_id == court.id:
                        b_start = booked_slot.start_time.strftime("%H:%M")
                        b_end = booked_slot.end_time.strftime("%H:%M")
                        if b_start < end_t and b_end > start_t:
                            is_available = False
                            break
                
                # Calculate price for this specific slot
                price_info = await pricing_service.calculate_slot_price(
                    venue_id, booking_date, start_t, end_t
                )
                
                court_slots.append({
                    "start_time": start_t,
                    "end_time": end_t,
                    "available": is_available,
                    "price": float(price_info["total"])
                })
                
            courts_data.append({
                "court_id": str(court.id),
                "court_name": court.name,
                "slots": court_slots
            })

        return {
            "venue_id": str(venue_id),
            "date": booking_date.isoformat(),
            "open_time": open_time_str,
            "close_time": close_time_str,
            "courts": courts_data
        }

    async def get_merchant_revenue_trend(
        self,
        merchant_id: uuid.UUID,
        days: int = 7,
    ) -> dict[str, Any]:
        """
        Get daily revenue and booking count for the last N days for a merchant.
        """
        # Get merchant's venues
        venue_result = await self.session.execute(
            select(Venue.id).where(Venue.merchant_id == merchant_id)
        )
        venue_ids = [row[0] for row in venue_result.all()]

        if not venue_ids:
            return {
                "items": [],
                "total_revenue": Decimal("0"),
                "total_bookings": 0,
            }

        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        # Query daily revenue
        # We group by booking_date
        query = (
            select(
                Booking.booking_date,
                func.sum(Booking.total_price).label("revenue"),
                func.count(Booking.id).label("booking_count"),
            )
            .where(
                and_(
                    Booking.venue_id.in_(venue_ids),
                    Booking.booking_date >= start_date,
                    Booking.booking_date <= end_date,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
                )
            )
            .group_by(Booking.booking_date)
            .order_by(Booking.booking_date)
        )

        result = await self.session.execute(query)
        daily_stats = {row.booking_date: row for row in result.all()}

        # Fill in gaps for days with no bookings
        items = []
        total_revenue = Decimal("0")
        total_bookings = 0

        for i in range(days):
            current_date = start_date + timedelta(days=i)
            stats = daily_stats.get(current_date)
            
            revenue = stats.revenue if stats else Decimal("0")
            count = stats.booking_count if stats else 0
            
            items.append({
                "date": current_date.isoformat(),
                "revenue": revenue,
                "booking_count": count,
            })
            
            total_revenue += revenue
            total_bookings += count

        return {
            "items": items,
            "total_revenue": total_revenue,
            "total_bookings": total_bookings,
        }

    async def get_merchant_stats(
        self,
        merchant_id: uuid.UUID,
    ) -> dict[str, Any]:
        """
        Get per-venue booking statistics and revenue for a merchant.
        """
        # Get merchant's venues
        venue_result = await self.session.execute(
            select(Venue).where(Venue.merchant_id == merchant_id)
        )
        venues = list(venue_result.scalars().all())

        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        venue_stats_list = []
        for venue in venues:
            # Count bookings MTD for this specific venue
            mtd_count_result = await self.session.execute(
                select(func.count(Booking.id)).where(
                    and_(
                        Booking.venue_id == venue.id,
                        Booking.booking_date >= start_of_month
                    )
                )
            )
            bookings_mtd = mtd_count_result.scalar() or 0

            # Calculate revenue MTD for this specific venue
            mtd_revenue_result = await self.session.execute(
                select(func.sum(Booking.total_price)).where(
                    and_(
                        Booking.venue_id == venue.id,
                        Booking.booking_date >= start_of_month,
                        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
                    )
                )
            )
            revenue_mtd = mtd_revenue_result.scalar() or Decimal("0")

            venue_stats_list.append({
                "id": str(venue.id),
                "name": venue.name,
                "status": "ACTIVE" if venue.is_active else "PENDING",
                "total_bookings": bookings_mtd,
                "revenue_mtd": revenue_mtd,
                "rating": 0.0,
            })

        return {
            "venues": venue_stats_list,
            "currency": "VND",
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


async def get_booking_service(session: Annotated[AsyncSession, Depends(get_db)]) -> BookingService:
    """
    Dependency to get booking service instance.

    Args:
        session: Database session

    Returns:
        BookingService instance
    """
    return BookingService(session)
