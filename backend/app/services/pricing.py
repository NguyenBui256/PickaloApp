"""
Pricing calculation service.

Implements dynamic pricing based on time slots, day types,
and venue-specific pricing tiers.
"""

import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import select, and_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func as sql_func

from app.core.database import get_db
from app.models.venue import Venue, VenueService, PricingTimeSlot, VenueType, DayType
from app.models.booking import Booking


class PricingService:
    """
    Service for calculating booking prices.

    Implements absolute price lookup based on time slots and day types.
    If no specific time slot is found, it falls back to the venue's default slot for that day type.
    """

    SERVICE_FEE_PERCENTAGE = Decimal("0")  # Removed 5% fee as per user request

    def __init__(self, session: AsyncSession):
        """Initialize pricing service with database session."""
        self.session = session

    def get_day_type(self, d: date) -> DayType:
        """Get day type enum from date."""
        if d.weekday() >= 5:  # Sat=5, Sun=6
            return DayType.WEEKEND
        return DayType.WEEKDAY

    def calculate_duration_hours(
        self,
        start_time: str,
        end_time: str,
    ) -> Decimal:
        """Calculate duration in hours (decimal)."""
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")

        if end < start:
            raise ValueError("end_time must be after start_time")

        delta = end - start
        return Decimal(delta.total_seconds() / 3600)

    async def get_venue_slot_price(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
    ) -> Decimal:
        """
        Get absolute price for venue slot.
        Checks for:
        1. Specific time slot with matching day of week
        2. Specific time slot with matching day type
        3. Default slot for matching day of week
        4. Default slot for matching day type
        """
        day_type = self.get_day_type(booking_date)
        day_index = booking_date.weekday() # 0=Mon, ..., 6=Sun
        t = datetime.strptime(start_time, "%H:%M").time()

        # 1. Check for specific custom pricing slot with day_of_week
        result = await self.session.execute(
            select(PricingTimeSlot).where(
                PricingTimeSlot.venue_id == venue_id,
                cast(PricingTimeSlot.days_of_week, String).contains(str(day_index)),
                PricingTimeSlot.is_default.is_(False),
                PricingTimeSlot.start_time <= t,
                PricingTimeSlot.end_time > t,
            )
        )
        custom_slot = result.scalar_one_or_none()
        if custom_slot:
            return custom_slot.price

        # 2. Check for specific custom pricing slot with day_type (legacy fallback)
        result = await self.session.execute(
            select(PricingTimeSlot).where(
                PricingTimeSlot.venue_id == venue_id,
                PricingTimeSlot.day_type == day_type,
                PricingTimeSlot.days_of_week.is_(None),
                PricingTimeSlot.is_default.is_(False),
                PricingTimeSlot.start_time <= t,
                PricingTimeSlot.end_time > t,
            )
        )
        custom_slot = result.scalar_one_or_none()
        if custom_slot:
            return custom_slot.price

        # 3. Fall back to default pricing slot for this day of week
        result = await self.session.execute(
            select(PricingTimeSlot).where(
                PricingTimeSlot.venue_id == venue_id,
                cast(PricingTimeSlot.days_of_week, String).contains(str(day_index)),
                PricingTimeSlot.is_default.is_(True),
            )
        )
        default_slot = result.scalar_one_or_none()
        if default_slot:
            return default_slot.price

        # 4. Fall back to default pricing slot for this day type
        result = await self.session.execute(
            select(PricingTimeSlot).where(
                PricingTimeSlot.venue_id == venue_id,
                PricingTimeSlot.day_type == day_type,
                PricingTimeSlot.is_default.is_(True),
            )
        )
        default_slot = result.scalar_one_or_none()
        if default_slot:
            return default_slot.price

        # 5. Last resort fallback
        return Decimal("0")

    async def calculate_slot_price(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
    ) -> dict[str, Any]:
        """Calculate price for a single time slot using absolute pricing."""
        # Calculate duration
        duration_hours = self.calculate_duration_hours(start_time, end_time)

        # Get absolute price per hour
        hourly_price = await self.get_venue_slot_price(
            venue_id, booking_date, start_time
        )

        # Calculate totals
        subtotal = hourly_price * duration_hours
        service_fee = subtotal * self.SERVICE_FEE_PERCENTAGE
        total = subtotal + service_fee

        return {
            "duration_hours": duration_hours,
            "hourly_price": hourly_price,
            "subtotal": subtotal,
            "service_fee": service_fee,
            "total": total,
            "currency": "VND",
        }

    async def calculate_booking_total(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
        service_ids: list[uuid.UUID] | None = None,
        service_quantities: dict[uuid.UUID, int] | None = None,
    ) -> dict[str, Any]:
        """
        Calculate total booking price including services.

        Args:
            venue_id: Venue UUID
            booking_date: Date of booking
            start_time: Start time (HH:MM format)
            end_time: End time (HH:MM format)
            service_ids: List of venue service IDs to include
            service_quantities: Dict mapping service_id → quantity

        Returns:
            Dict with full price breakdown including services
        """
        # Get slot pricing
        slot_pricing = await self.calculate_slot_price(
            venue_id, booking_date, start_time, end_time
        )

        total = slot_pricing["total"]
        subtotal = slot_pricing["subtotal"]
        service_fee = slot_pricing["service_fee"]

        # Add services
        services_breakdown = []
        services_total = Decimal("0")

        if service_ids:
            for service_id in service_ids:
                result = await self.session.execute(
                    select(VenueService).where(
                        VenueService.id == service_id,
                        VenueService.is_available.is_(True),
                    )
                )
                service = result.scalar_one_or_none()

                if service:
                    quantity = service_quantities.get(service_id, 1) if service_quantities else 1
                    service_cost = service.price_per_unit * Decimal(quantity)
                    services_total += service_cost

                    services_breakdown.append({
                        "service_id": str(service.id),
                        "name": service.name,
                        "quantity": quantity,
                        "unit_price": service.price_per_unit,
                        "total": service_cost,
                    })

        # Final total
        final_total = subtotal + services_total + service_fee

        return {
            "venue_pricing": slot_pricing,
            "services": services_breakdown,
            "services_total": services_total,
            "subtotal": subtotal + services_total,
            "service_fee": service_fee,
            "total": final_total,
            "currency": "VND",
        }

    async def calculate_multi_slot_total(
        self,
        venue_id: uuid.UUID,
        slots: list[dict[str, Any]],  # List of {date, start_time, end_time}
        service_ids: list[uuid.UUID] | None = None,
        service_quantities: dict[uuid.UUID, int] | None = None,
    ) -> dict[str, Any]:
        """
        Calculate total price for multiple slots across potentially different courts/times.
        """
        total_subtotal = Decimal("0")
        total_service_fee = Decimal("0")
        slots_breakdown = []

        for slot_data in slots:
            slot_pricing = await self.calculate_slot_price(
                venue_id, 
                slot_data["date"], 
                slot_data["start_time"], 
                slot_data["end_time"]
            )
            total_subtotal += slot_pricing["subtotal"]
            total_service_fee += slot_pricing["service_fee"]
            
            slots_breakdown.append({
                "start_time": slot_data["start_time"],
                "end_time": slot_data["end_time"],
                "court_id": slot_data.get("court_id"),
                "pricing": slot_pricing
            })

        # Add services
        services_breakdown = []
        services_total = Decimal("0")

        if service_ids:
            for service_id in service_ids:
                result = await self.session.execute(
                    select(VenueService).where(
                        VenueService.id == service_id,
                        VenueService.is_available.is_(True),
                    )
                )
                service = result.scalar_one_or_none()

                if service:
                    quantity = service_quantities.get(service_id, 1) if service_quantities else 1
                    service_cost = service.price_per_unit * Decimal(quantity)
                    services_total += service_cost

                    services_breakdown.append({
                        "service_id": str(service.id),
                        "name": service.name,
                        "quantity": quantity,
                        "unit_price": service.price_per_unit,
                        "total": service_cost,
                    })

        final_total = total_subtotal + services_total + total_service_fee

        return {
            "booking_date": slots[0]["date"] if slots else None,
            "slots": slots_breakdown,
            "services": services_breakdown,
            "services_total": services_total,
            "subtotal": total_subtotal + services_total,
            "service_fee": total_service_fee,
            "total": final_total,
            "currency": "VND",
        }


async def get_pricing_service(session: Annotated[AsyncSession, Depends(get_db)]) -> PricingService:
    """
    Dependency to get pricing service instance.

    Args:
        session: Database session

    Returns:
        PricingService instance
    """
    return PricingService(session)
