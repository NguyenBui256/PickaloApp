"""
Pricing calculation service.

Implements dynamic pricing based on time slots, day types,
and venue-specific pricing tiers.
"""

import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func as sql_func

from app.models.venue import Venue, VenueService, PricingTimeSlot, VenueType, DayType
from app.models.booking import Booking


class PricingService:
    """
    Service for calculating booking prices.

    Implements PRD pricing formula:
    Total = (BasePrice × TimeSlotFactor) + ServiceFee

    Time Slot Factors:
    - Weekday 05:00-16:00: 1.0x (off-peak)
    - Weekday 16:00-22:00: 1.5x (peak)
    - Weekend all day: +20% (1.2x base)
    - Weekend 16:00-22:00: 1.5 × 1.2 = 1.8x
    """

    # Default pricing multipliers
    DEFAULT_OFF_PEAK_FACTOR = Decimal("1.0")
    DEFAULT_PEAK_FACTOR = Decimal("1.5")
    WEEKEND_SURCHARGE = Decimal("0.2")  # +20%
    SERVICE_FEE_PERCENTAGE = Decimal("0.05")  # 5%

    # Peak hours: 16:00 - 22:00
    PEAK_HOUR_START = time(16, 0)
    PEAK_HOUR_END = time(22, 0)

    def __init__(self, session: AsyncSession):
        """Initialize pricing service with database session."""
        self.session = session

    def is_peak_hour(self, t: time) -> bool:
        """
        Check if time is during peak hours.

        Args:
            t: Time to check

        Returns:
            True if peak hour (16:00-22:00)
        """
        return self.PEAK_HOUR_START <= t < self.PEAK_HOUR_END

    def is_weekend(self, d: date) -> bool:
        """
        Check if date is weekend.

        Args:
            d: Date to check

        Returns:
            True if Saturday or Sunday
        """
        return d.weekday() >= 5  # Sat=5, Sun=6

    def get_day_type(self, d: date) -> DayType:
        """
        Get day type enum from date.

        Args:
            d: Date to check

        Returns:
            DayType enum (WEEKDAY, WEEKEND, or HOLIDAY)
        """
        if self.is_weekend(d):
            return DayType.WEEKEND
        # TODO: Check holiday calendar for HOLIDAY type
        return DayType.WEEKDAY

    def calculate_duration_minutes(
        self,
        start_time: str,
        end_time: str,
    ) -> int:
        """
        Calculate duration between two times in minutes.

        Args:
            start_time: Start time (HH:MM format)
            end_time: End time (HH:MM format)

        Returns:
            Duration in minutes

        Raises:
            ValueError: If end_time is before start_time
        """
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")

        if end < start:
            raise ValueError("end_time must be after start_time")

        delta = end - start
        return int(delta.total_seconds() / 60)

    def calculate_duration_hours(
        self,
        start_time: str,
        end_time: str,
    ) -> Decimal:
        """
        Calculate duration in hours (decimal).

        Args:
            start_time: Start time (HH:MM format)
            end_time: End time (HH:MM format)

        Returns:
            Duration in hours as Decimal
        """
        minutes = self.calculate_duration_minutes(start_time, end_time)
        return Decimal(minutes) / Decimal(60)

    def get_default_price_factor(
        self,
        booking_date: date,
        start_time: str,
    ) -> Decimal:
        """
        Get default price multiplier based on day and time.

        Args:
            booking_date: Date of booking
            start_time: Start time (HH:MM format)

        Returns:
            Price multiplier (Decimal)
        """
        t = datetime.strptime(start_time, "%H:%M").time()
        base_factor = self.DEFAULT_OFF_PEAK_FACTOR

        # Check for weekend
        if self.is_weekend(booking_date):
            base_factor += self.WEEKEND_SURCHARGE

        # Check for peak hours
        if self.is_peak_hour(t):
            # Peak hours: 1.5x base
            factor = self.DEFAULT_PEAK_FACTOR
            if self.is_weekend(booking_date):
                # Weekend peak: 1.5x with weekend base
                # (1.0 + 0.2) × 1.5 = 1.8
                factor = (self.DEFAULT_OFF_PEAK_FACTOR + self.WEEKEND_SURCHARGE) * self.DEFAULT_PEAK_FACTOR
            return factor
        else:
            # Off-peak: use base factor (with weekend if applicable)
            return base_factor

    async def get_venue_price_factor(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
    ) -> Decimal:
        """
        Get price factor for venue (custom or default).

        Checks if venue has custom pricing for the day/time slot.
        Falls back to default pricing if no custom pricing found.

        Args:
            venue_id: Venue UUID
            booking_date: Date of booking
            start_time: Start time (HH:MM format)

        Returns:
            Price multiplier (Decimal)
        """
        day_type = self.get_day_type(booking_date)
        t = datetime.strptime(start_time, "%H:%M").time()

        # Check for custom pricing slot
        result = await self.session.execute(
            select(PricingTimeSlot).where(
                PricingTimeSlot.venue_id == venue_id,
                PricingTimeSlot.day_type == day_type,
                PricingTimeSlot.start_time <= t,
                PricingTimeSlot.end_time > t,
            )
        )
        custom_slot = result.scalar_one_or_none()

        if custom_slot:
            return custom_slot.price_factor

        # Fall back to default pricing
        return self.get_default_price_factor(booking_date, start_time)

    async def calculate_slot_price(
        self,
        venue_id: uuid.UUID,
        booking_date: date,
        start_time: str,
        end_time: str,
    ) -> dict[str, Any]:
        """
        Calculate price for a single time slot.

        Args:
            venue_id: Venue UUID
            booking_date: Date of booking
            start_time: Start time (HH:MM format)
            end_time: End time (HH:MM format)

        Returns:
            Dict with:
                - base_price: Venue's base hourly rate
                - duration_hours: Booking duration
                - price_factor: Applied multiplier
                - hourly_price: Price per hour after factor
                - subtotal: Hourly price × duration
                - service_fee: 5% service fee
                - total: Final price
        """
        # Get venue
        result = await self.session.execute(
            select(Venue).where(Venue.id == venue_id)
        )
        venue = result.scalar_one_or_none()

        if not venue:
            raise ValueError("Venue not found")

        # Calculate duration
        duration_hours = self.calculate_duration_hours(start_time, end_time)

        # Get price factor
        price_factor = await self.get_venue_price_factor(
            venue_id, booking_date, start_time
        )

        # Calculate prices
        base_price = venue.base_price_per_hour
        hourly_price = base_price * price_factor
        subtotal = hourly_price * duration_hours
        service_fee = subtotal * self.SERVICE_FEE_PERCENTAGE
        total = subtotal + service_fee

        return {
            "base_price": base_price,
            "duration_hours": duration_hours,
            "price_factor": price_factor,
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


async def get_pricing_service(session: AsyncSession) -> PricingService:
    """
    Dependency to get pricing service instance.

    Args:
        session: Database session

    Returns:
        PricingService instance
    """
    return PricingService(session)
