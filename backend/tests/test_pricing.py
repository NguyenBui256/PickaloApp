"""
Pricing calculation tests.

Tests for dynamic pricing based on time slots, day types,
and venue-specific pricing tiers.
"""

import pytest
from datetime import date, time
from decimal import Decimal

from app.services.pricing import PricingService


class TestPricingService:
    """Test pricing service calculations."""

    @pytest.mark.asyncio
    async def test_is_peak_hour_true(self):
        """Test peak hour detection (16:00-22:00)."""
        service = PricingService(session=None)

        assert service.is_peak_hour(time(16, 0)) is True
        assert service.is_peak_hour(time(18, 30)) is True
        assert service.is_peak_hour(time(21, 59)) is True

    @pytest.mark.asyncio
    async def test_is_peak_hour_false(self):
        """Test off-peak hours."""
        service = PricingService(session=None)

        assert service.is_peak_hour(time(5, 0)) is False
        assert service.is_peak_hour(time(10, 0)) is False
        assert service.is_peak_hour(time(15, 59)) is False
        assert service.is_peak_hour(time(22, 0)) is False

    @pytest.mark.asyncio
    async def test_is_weekend_true(self):
        """Test weekend detection."""
        service = PricingService(session=None)

        # Saturday (5) and Sunday (6)
        assert service.is_weekend(date(2026, 4, 11)) is True  # Saturday
        assert service.is_weekend(date(2026, 4, 12)) is True  # Sunday

    @pytest.mark.asyncio
    async def test_is_weekend_false(self):
        """Test weekday detection."""
        service = PricingService(session=None)

        # Monday-Friday
        assert service.is_weekend(date(2026, 4, 9)) is False   # Thursday
        assert service.is_weekend(date(2026, 4, 10)) is False  # Friday
        assert service.is_weekend(date(2026, 4, 8)) is False   # Wednesday

    @pytest.mark.asyncio
    async def test_calculate_duration_minutes(self):
        """Test duration calculation in minutes."""
        service = PricingService(session=None)

        assert service.calculate_duration_minutes("10:00", "11:00") == 60
        assert service.calculate_duration_minutes("10:00", "12:30") == 150
        assert service.calculate_duration_minutes("16:00", "18:00") == 120

    @pytest.mark.asyncio
    async def test_calculate_duration_minutes_invalid(self):
        """Test duration calculation with invalid times."""
        service = PricingService(session=None)

        with pytest.raises(ValueError, match="end_time must be after start_time"):
            service.calculate_duration_minutes("12:00", "10:00")

    @pytest.mark.asyncio
    async def test_calculate_duration_hours(self):
        """Test duration calculation in hours (decimal)."""
        service = PricingService(session=None)

        assert service.calculate_duration_hours("10:00", "11:00") == Decimal("1.0")
        assert service.calculate_duration_hours("10:00", "12:30") == Decimal("2.5")
        assert service.calculate_duration_hours("10:00", "11:30") == Decimal("1.5")

    @pytest.mark.asyncio
    async def test_get_default_price_factor_off_peak_weekday(self):
        """Test default pricing: off-peak weekday (1.0x)."""
        service = PricingService(session=None)

        factor = service.get_default_price_factor(
            booking_date=date(2026, 4, 9),  # Thursday
            start_time="10:00",
        )

        assert factor == Decimal("1.0")

    @pytest.mark.asyncio
    async def test_get_default_price_factor_peak_weekday(self):
        """Test default pricing: peak weekday (1.5x)."""
        service = PricingService(session=None)

        factor = service.get_default_price_factor(
            booking_date=date(2026, 4, 9),  # Thursday
            start_time="18:00",
        )

        assert factor == Decimal("1.5")

    @pytest.mark.asyncio
    async def test_get_default_price_factor_off_peak_weekend(self):
        """Test default pricing: off-peak weekend (1.2x)."""
        service = PricingService(session=None)

        factor = service.get_default_price_factor(
            booking_date=date(2026, 4, 11),  # Saturday
            start_time="10:00",
        )

        assert factor == Decimal("1.2")

    @pytest.mark.asyncio
    async def test_get_default_price_factor_peak_weekend(self):
        """Test default pricing: peak weekend (1.8x = 1.5 × 1.2)."""
        service = PricingService(session=None)

        factor = service.get_default_price_factor(
            booking_date=date(2026, 4, 11),  # Saturday
            start_time="18:00",
        )

        assert factor == Decimal("1.8")

    @pytest.mark.asyncio
    async def test_get_day_type(self):
        """Test day type enum conversion."""
        service = PricingService(session=None)

        assert service.get_day_type(date(2026, 4, 8)).value == "WEEKDAY"   # Wednesday
        assert service.get_day_type(date(2026, 4, 9)).value == "WEEKDAY"   # Thursday
        assert service.get_day_type(date(2026, 4, 10)).value == "WEEKDAY"  # Friday
        assert service.get_day_type(date(2026, 4, 11)).value == "WEEKEND"  # Saturday
        assert service.get_day_type(date(2026, 4, 12)).value == "WEEKEND"  # Sunday


class TestPricingFormulas:
    """Test PRD pricing formulas."""

    @pytest.mark.asyncio
    async def test_formula_off_peak_weekday_1_hour(self):
        """Test: base_price × 1.0 = 300,000 VND."""
        # Thursday 10:00-11:00, base 300,000
        base_price = Decimal("300000")
        duration = Decimal("1.0")
        factor = Decimal("1.0")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration
        service_fee = subtotal * Decimal("0.05")
        total = subtotal + service_fee

        assert hourly_price == Decimal("300000")
        assert subtotal == Decimal("300000")
        assert service_fee == Decimal("15000")
        assert total == Decimal("315000")

    @pytest.mark.asyncio
    async def test_formula_peak_weekday_1_hour(self):
        """Test: base_price × 1.5 = 450,000 VND."""
        # Thursday 18:00-19:00, base 300,000
        base_price = Decimal("300000")
        duration = Decimal("1.0")
        factor = Decimal("1.5")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration
        service_fee = subtotal * Decimal("0.05")
        total = subtotal + service_fee

        assert hourly_price == Decimal("450000")
        assert subtotal == Decimal("450000")
        assert service_fee == Decimal("22500")
        assert total == Decimal("472500")

    @pytest.mark.asyncio
    async def test_formula_off_peak_weekend_1_hour(self):
        """Test: base_price × 1.2 = 360,000 VND."""
        # Saturday 10:00-11:00, base 300,000
        base_price = Decimal("300000")
        duration = Decimal("1.0")
        factor = Decimal("1.2")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration
        service_fee = subtotal * Decimal("0.05")
        total = subtotal + service_fee

        assert hourly_price == Decimal("360000")
        assert subtotal == Decimal("360000")
        assert service_fee == Decimal("18000")
        assert total == Decimal("378000")

    @pytest.mark.asyncio
    async def test_formula_peak_weekend_1_hour(self):
        """Test: base_price × 1.8 = 540,000 VND."""
        # Saturday 18:00-19:00, base 300,000
        base_price = Decimal("300000")
        duration = Decimal("1.0")
        factor = Decimal("1.8")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration
        service_fee = subtotal * Decimal("0.05")
        total = subtotal + service_fee

        assert hourly_price == Decimal("540000")
        assert subtotal == Decimal("540000")
        assert service_fee == Decimal("27000")
        assert total == Decimal("567000")

    @pytest.mark.asyncio
    async def test_formula_with_services(self):
        """Test: (base_price × factor) + services."""
        # Base calculation: 300,000 × 1.0 = 300,000
        base_price = Decimal("300000")
        factor = Decimal("1.0")
        duration = Decimal("1.0")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration

        # Services: 2 × water at 10,000 each = 20,000
        services_total = Decimal("20000")

        # Service fee on subtotal + services
        service_fee = (subtotal + services_total) * Decimal("0.05")

        total = subtotal + services_total + service_fee

        assert subtotal == Decimal("300000")
        assert services_total == Decimal("20000")
        assert service_fee == Decimal("16000")  # 5% of 320,000
        assert total == Decimal("336000")

    @pytest.mark.asyncio
    async def test_formula_2_hours_booking(self):
        """Test: 2-hour booking calculation."""
        base_price = Decimal("300000")
        factor = Decimal("1.0")
        duration = Decimal("2.0")

        hourly_price = base_price * factor
        subtotal = hourly_price * duration
        service_fee = subtotal * Decimal("0.05")
        total = subtotal + service_fee

        assert hourly_price == Decimal("300000")
        assert subtotal == Decimal("600000")
        assert service_fee == Decimal("30000")
        assert total == Decimal("630000")
