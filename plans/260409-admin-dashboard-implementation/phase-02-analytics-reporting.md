# Phase 2: Backend - Analytics & Reporting

**Status:** Pending
**Priority:** P2
**Estimated Effort:** 6 hours

## Overview

Implement analytics endpoints for the admin dashboard. These endpoints provide time-series data for revenue, bookings, users, and venues to power charts and trend visualizations.

## Related Files

### Files to Create
- `backend/app/schemas/analytics.py` - Analytics request/response schemas
- `backend/app/services/analytics.py` - Analytics aggregation service
- `backend/app/api/v1/endpoints/analytics.py` - Analytics API routes
- `backend/tests/test_analytics.py` - Analytics tests

### Files to Modify
- `backend/app/api/v1/api.py` - Register analytics router

---

## Implementation Steps

### Step 1: Create Analytics Schemas

**File:** `backend/app/schemas/analytics.py`

```python
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models.user import UserRole
from app.models.booking import BookingStatus

# Time series data point
class TimeSeriesPoint(BaseModel):
    date: str  # ISO date string
    value: int | Decimal | float
    label: str | None = None  # Optional label for display

# Revenue Analytics
class RevenueMetrics(BaseModel):
    total_revenue: Decimal
    revenue_by_period: list[TimeSeriesPoint]
    revenue_by_method: dict[str, Decimal]  # {payment_method: amount}
    average_order_value: Decimal
    refund_amount: Decimal

class RevenueAnalyticsRequest(BaseModel):
    period: Annotated[
        Literal["day", "week", "month", "quarter", "year"],
        Field(default="month")
    ]
    date_from: date | None = None
    date_to: date | None = None
    venue_id: str | None = None

# Booking Analytics
class BookingMetrics(BaseModel):
    total_bookings: int
    bookings_by_status: dict[str, int]
    bookings_by_period: list[TimeSeriesPoint]
    bookings_by_venue_type: dict[str, int]
    cancellation_rate: float
    average_booking_value: Decimal

class BookingAnalyticsRequest(BaseModel):
    period: Literal["day", "week", "month", "quarter", "year"] = "month"
    date_from: date | None = None
    date_to: date | None = None
    venue_id: str | None = None

# User Analytics
class UserMetrics(BaseModel):
    total_users: int
    new_users_by_period: list[TimeSeriesPoint]
    active_users_by_period: list[TimeSeriesPoint]
    users_by_role: dict[str, int]
    verified_users: int
    user_growth_rate: float

class UserAnalyticsRequest(BaseModel):
    period: Literal["day", "week", "month", "quarter", "year"] = "month"
    date_from: date | None = None
    date_to: date | None = None

# Venue Analytics
class VenueMetrics(BaseModel):
    total_venues: int
    venues_by_type: dict[str, int]
    venues_by_district: dict[str, int]
    verified_venues: int
    venue_verification_rate: float
    top_venues_by_bookings: list[dict]
    top_venues_by_revenue: list[dict]

class VenueAnalyticsRequest(BaseModel):
    period: Literal["day", "week", "month", "quarter", "year"] = "month"
    date_from: date | None = None
    date_to: date | None = None
    limit: Annotated[int, Field(ge=1, le=50)] = 10

# Export request
class ExportRequest(BaseModel):
    report_type: Literal["revenue", "bookings", "users", "venues"]
    period: Literal["day", "week", "month", "quarter", "year"] = "month"
    date_from: date | None = None
    date_to: date | None = None
    format: Literal["csv", "json"] = "csv"
```

### Step 2: Create Analytics Service

**File:** `backend/app/services/analytics.py`

```python
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Literal

from sqlalchemy import select, func, and_, case, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType
from app.models.booking import Booking, BookingStatus

class AnalyticsService:
    """Service for aggregating analytics data."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # Revenue Analytics
    async def get_revenue_analytics(
        self,
        period: str = "month",
        date_from: date | None = None,
        date_to: date | None = None,
        venue_id: str | None = None
    ) -> dict:
        """
        Calculate revenue analytics with time series data.

        Args:
            period: Time granularity (day, week, month, quarter, year)
            date_from: Start date filter
            date_to: End date filter
            venue_id: Optional venue filter

        Returns:
            Revenue metrics with time series breakdown
        """
        # Default to last 30 days if no range specified
        if not date_from:
            date_from = date.today() - timedelta(days=30)
        if not date_to:
            date_to = date.today()

        # Total revenue
        total_revenue = await self._calculate_total_revenue(
            date_from, date_to, venue_id
        )

        # Revenue by period (time series)
        revenue_by_period = await self._revenue_time_series(
            date_from, date_to, venue_id, period
        )

        # Revenue by payment method
        revenue_by_method = await self._revenue_by_payment_method(
            date_from, date_to, venue_id
        )

        # Average order value
        average_order_value = await self._calculate_average_order_value(
            date_from, date_to, venue_id
        )

        # Refund amount (cancelled paid bookings)
        refund_amount = await self._calculate_refund_amount(
            date_from, date_to, venue_id
        )

        return {
            "total_revenue": total_revenue,
            "revenue_by_period": revenue_by_period,
            "revenue_by_method": revenue_by_method,
            "average_order_value": average_order_value,
            "refund_amount": refund_amount
        }

    async def _calculate_total_revenue(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> Decimal:
        """Calculate total revenue from completed bookings."""
        query = select(func.sum(Booking.total_price)).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.COMPLETED,
                Booking.paid_at.isnot(None)
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return result.scalar() or Decimal("0")

    async def _revenue_time_series(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None,
        period: str
    ) -> list[dict]:
        """Generate time series data for revenue."""
        # Determine truncation based on period
        trunc_map = {
            "day": "day",
            "week": "week",
            "month": "month",
            "quarter": "quarter",
            "year": "year"
        }

        # Use PostgreSQL date_trunc
        from sqlalchemy import text

        query = select(
            func.date_trunc(period, Booking.booking_date).label("period"),
            func.sum(Booking.total_price).label("revenue")
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.COMPLETED,
                Booking.paid_at.isnot(None)
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        query = query.group_by("period").order_by("period")

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                "date": row.period.strftime("%Y-%m-%d"),
                "value": float(row.revenue),
                "label": row.period.strftime("%b %d" if period in ["day", "week"] else "%b %Y")
            }
            for row in rows
        ]

    async def _revenue_by_payment_method(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> dict[str, Decimal]:
        """Calculate revenue breakdown by payment method."""
        query = select(
            Booking.payment_method,
            func.sum(Booking.total_price)
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.COMPLETED,
                Booking.paid_at.isnot(None)
            )
        ).group_by(Booking.payment_method)

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return {method or "Unknown": Decimal(amount) for method, amount in result.all()}

    async def _calculate_average_order_value(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> Decimal:
        """Calculate average booking value."""
        query = select(func.avg(Booking.total_price)).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.COMPLETED,
                Booking.paid_at.isnot(None)
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return Decimal(str(result.scalar() or 0))

    async def _calculate_refund_amount(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> Decimal:
        """Calculate total refunded amount (cancelled paid bookings)."""
        query = select(func.sum(Booking.total_price)).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.CANCELLED,
                Booking.paid_at.isnot(None)
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return result.scalar() or Decimal("0")

    # Booking Analytics
    async def get_booking_analytics(
        self,
        period: str = "month",
        date_from: date | None = None,
        date_to: date | None = None,
        venue_id: str | None = None
    ) -> dict:
        """Calculate booking analytics."""
        if not date_from:
            date_from = date.today() - timedelta(days=30)
        if not date_to:
            date_to = date.today()

        # Total bookings
        total_bookings = await self._count_bookings(
            date_from, date_to, venue_id
        )

        # Bookings by status
        bookings_by_status = await self._bookings_by_status(
            date_from, date_to, venue_id
        )

        # Bookings by period
        bookings_by_period = await self._bookings_time_series(
            date_from, date_to, venue_id, period
        )

        # Bookings by venue type
        bookings_by_venue_type = await self._bookings_by_venue_type(
            date_from, date_to
        )

        # Cancellation rate
        cancellation_rate = await self._calculate_cancellation_rate(
            date_from, date_to, venue_id
        )

        # Average booking value
        average_booking_value = await self._calculate_average_order_value(
            date_from, date_to, venue_id
        )

        return {
            "total_bookings": total_bookings,
            "bookings_by_status": bookings_by_status,
            "bookings_by_period": bookings_by_period,
            "bookings_by_venue_type": bookings_by_venue_type,
            "cancellation_rate": cancellation_rate,
            "average_booking_value": average_booking_value
        }

    async def _count_bookings(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> int:
        """Count total bookings in period."""
        query = select(func.count(Booking.id)).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _bookings_by_status(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> dict[str, int]:
        """Count bookings by status."""
        query = select(
            Booking.status,
            func.count(Booking.id)
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to
            )
        ).group_by(Booking.status)

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(query)
        return {status.value: count for status, count in result.all()}

    async def _bookings_time_series(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None,
        period: str
    ) -> list[dict]:
        """Generate time series for bookings."""
        from sqlalchemy import text

        query = select(
            func.date_trunc(period, Booking.booking_date).label("period"),
            func.count(Booking.id).label("count")
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to
            )
        )

        if venue_id:
            query = query.where(Booking.venue_id == venue_id)

        query = query.group_by("period").order_by("period")

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                "date": row.period.strftime("%Y-%m-%d"),
                "value": row.count,
                "label": row.period.strftime("%b %d" if period in ["day", "week"] else "%b %Y")
            }
            for row in rows
        ]

    async def _bookings_by_venue_type(
        self,
        date_from: date,
        date_to: date
    ) -> dict[str, int]:
        """Count bookings by venue type."""
        query = select(
            Venue.venue_type,
            func.count(Booking.id)
        ).join(
            Booking, Venue.id == Booking.venue_id
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to
            )
        ).group_by(Venue.venue_type)

        result = await self.session.execute(query)
        return {venue_type.value: count for venue_type, count in result.all()}

    async def _calculate_cancellation_rate(
        self,
        date_from: date,
        date_to: date,
        venue_id: str | None = None
    ) -> float:
        """Calculate percentage of cancelled bookings."""
        total = await self._count_bookings(date_from, date_to, venue_id)

        if total == 0:
            return 0.0

        cancelled_query = select(func.count(Booking.id)).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to,
                Booking.status == BookingStatus.CANCELLED
            )
        )

        if venue_id:
            cancelled_query = cancelled_query.where(Booking.venue_id == venue_id)

        result = await self.session.execute(cancelled_query)
        cancelled = result.scalar() or 0

        return round((cancelled / total) * 100, 2)

    # User Analytics
    async def get_user_analytics(
        self,
        period: str = "month",
        date_from: date | None = None,
        date_to: date | None = None
    ) -> dict:
        """Calculate user analytics."""
        if not date_from:
            date_from = date.today() - timedelta(days=30)
        if not date_to:
            date_to = date.today()

        # Total users
        total_users = await self._count_total_users()

        # New users by period
        new_users_by_period = await self._new_users_time_series(
            date_from, date_to, period
        )

        # Active users by period (users with bookings)
        active_users_by_period = await self._active_users_time_series(
            date_from, date_to, period
        )

        # Users by role
        users_by_role = await self._users_by_role()

        # Verified users
        verified_users = await self._count_verified_users()

        # User growth rate
        user_growth_rate = await self._calculate_user_growth_rate(
            date_from, date_to
        )

        return {
            "total_users": total_users,
            "new_users_by_period": new_users_by_period,
            "active_users_by_period": active_users_by_period,
            "users_by_role": users_by_role,
            "verified_users": verified_users,
            "user_growth_rate": user_growth_rate
        }

    async def _count_total_users(self) -> int:
        """Count total active users."""
        query = select(func.count(User.id)).where(
            User.deleted_at.is_(None)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _new_users_time_series(
        self,
        date_from: date,
        date_to: date,
        period: str
    ) -> list[dict]:
        """Generate time series for new user registrations."""
        from sqlalchemy import text

        query = select(
            func.date_trunc(period, User.created_at).label("period"),
            func.count(User.id).label("count")
        ).where(
            and_(
                func.date(User.created_at) >= date_from,
                func.date(User.created_at) <= date_to,
                User.deleted_at.is_(None)
            )
        ).group_by("period").order_by("period")

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                "date": row.period.strftime("%Y-%m-%d"),
                "value": row.count,
                "label": row.period.strftime("%b %d" if period in ["day", "week"] else "%b %Y")
            }
            for row in rows
        ]

    async def _active_users_time_series(
        self,
        date_from: date,
        date_to: date,
        period: str
    ) -> list[dict]:
        """Generate time series for active users (with bookings)."""
        from sqlalchemy import text, distinct

        query = select(
            func.date_trunc(period, Booking.booking_date).label("period"),
            func.count(distinct(Booking.user_id)).label("count")
        ).where(
            and_(
                Booking.booking_date >= date_from,
                Booking.booking_date <= date_to
            )
        ).group_by("period").order_by("period")

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                "date": row.period.strftime("%Y-%m-%d"),
                "value": row.count,
                "label": row.period.strftime("%b %d" if period in ["day", "week"] else "%b %Y")
            }
            for row in rows
        ]

    async def _users_by_role(self) -> dict[str, int]:
        """Count users by role."""
        query = select(
            User.role,
            func.count(User.id)
        ).where(
            User.deleted_at.is_(None)
        ).group_by(User.role)

        result = await self.session.execute(query)
        return {role.value: count for role, count in result.all()}

    async def _count_verified_users(self) -> int:
        """Count verified users."""
        query = select(func.count(User.id)).where(
            and_(
                User.is_verified.is_(True),
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _calculate_user_growth_rate(
        self,
        date_from: date,
        date_to: date
    ) -> float:
        """Calculate user growth rate percentage."""
        # Users at start
        start_count = await self._count_users_before(date_from)

        # Users at end
        end_count = await self._count_users_before(date_to + timedelta(days=1))

        if start_count == 0:
            return 100.0

        return round(((end_count - start_count) / start_count) * 100, 2)

    async def _count_users_before(self, target_date: date) -> int:
        """Count users created before a date."""
        query = select(func.count(User.id)).where(
            and_(
                func.date(User.created_at) < target_date,
                User.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    # Venue Analytics
    async def get_venue_analytics(
        self,
        period: str = "month",
        date_from: date | None = None,
        date_to: date | None = None,
        limit: int = 10
    ) -> dict:
        """Calculate venue analytics."""
        # Total venues
        total_venues = await self._count_total_venues()

        # Venues by type
        venues_by_type = await self._venues_by_type()

        # Venues by district
        venues_by_district = await self._venues_by_district()

        # Verified venues
        verified_venues = await self._count_verified_venues()

        # Verification rate
        venue_verification_rate = (
            round((verified_venues / total_venues) * 100, 2)
            if total_venues > 0 else 0
        )

        # Top venues by bookings
        top_venues_by_bookings = await self._top_venues_by_bookings(limit)

        # Top venues by revenue
        top_venues_by_revenue = await self._top_venues_by_revenue(limit)

        return {
            "total_venues": total_venues,
            "venues_by_type": venues_by_type,
            "venues_by_district": venues_by_district,
            "verified_venues": verified_venues,
            "venue_verification_rate": venue_verification_rate,
            "top_venues_by_bookings": top_venues_by_bookings,
            "top_venues_by_revenue": top_venues_by_revenue
        }

    async def _count_total_venues(self) -> int:
        """Count total active venues."""
        query = select(func.count(Venue.id)).where(
            Venue.deleted_at.is_(None)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _venues_by_type(self) -> dict[str, int]:
        """Count venues by type."""
        query = select(
            Venue.venue_type,
            func.count(Venue.id)
        ).where(
            Venue.deleted_at.is_(None)
        ).group_by(Venue.venue_type)

        result = await self.session.execute(query)
        return {venue_type.value: count for venue_type, count in result.all()}

    async def _venues_by_district(self) -> dict[str, int]:
        """Count venues by district."""
        query = select(
            Venue.district,
            func.count(Venue.id)
        ).where(
            and_(
                Venue.deleted_at.is_(None),
                Venue.district.isnot(None)
            )
        ).group_by(Venue.district)

        result = await self.session.execute(query)
        return {district or "Unknown": count for district, count in result.all()}

    async def _count_verified_venues(self) -> int:
        """Count verified venues."""
        query = select(func.count(Venue.id)).where(
            and_(
                Venue.is_verified.is_(True),
                Venue.deleted_at.is_(None)
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def _top_venues_by_bookings(self, limit: int) -> list[dict]:
        """Get top venues by number of bookings."""
        query = select(
            Venue.id,
            Venue.name,
            Venue.district,
            func.count(Booking.id).label("booking_count")
        ).join(
            Booking, Venue.id == Booking.venue_id
        ).where(
            Venue.deleted_at.is_(None)
        ).group_by(
            Venue.id, Venue.name, Venue.district
        ).order_by(
            func.count(Booking.id).desc()
        ).limit(limit)

        result = await self.session.execute(query)
        return [
            {
                "venue_id": str(row.id),
                "name": row.name,
                "district": row.district,
                "booking_count": row.booking_count
            }
            for row in result.all()
        ]

    async def _top_venues_by_revenue(self, limit: int) -> list[dict]:
        """Get top venues by revenue."""
        query = select(
            Venue.id,
            Venue.name,
            Venue.district,
            func.sum(Booking.total_price).label("total_revenue")
        ).join(
            Booking, Venue.id == Booking.venue_id
        ).where(
            and_(
                Venue.deleted_at.is_(None),
                Booking.status == BookingStatus.COMPLETED
            )
        ).group_by(
            Venue.id, Venue.name, Venue.district
        ).order_by(
            func.sum(Booking.total_price).desc()
        ).limit(limit)

        result = await self.session.execute(query)
        return [
            {
                "venue_id": str(row.id),
                "name": row.name,
                "district": row.district,
                "total_revenue": float(row.total_revenue)
            }
            for row in result.all()
        ]
```

### Step 3: Create Analytics Endpoints

**File:** `backend/app/api/v1/endpoints/analytics.py`

```python
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin, DBSession
from app.models.user import User
from app.schemas.analytics import (
    RevenueAnalyticsRequest,
    RevenueMetrics,
    BookingAnalyticsRequest,
    BookingMetrics,
    UserAnalyticsRequest,
    UserMetrics,
    VenueAnalyticsRequest,
    VenueMetrics,
)

from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])

@router.get("/revenue", response_model=RevenueMetrics)
async def get_revenue_analytics(
    period: Annotated[str, Query()] = "month",
    date_from: Annotated[str | None, Query()] = None,
    date_to: Annotated[str | None, Query()] = None,
    venue_id: Annotated[str | None, Query()] = None,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
) -> RevenueMetrics:
    """
    Get revenue analytics with time series data.

    - **period**: Time granularity (day, week, month, quarter, year)
    - **date_from**: Start date (ISO format)
    - **date_to**: End date (ISO format)
    - **venue_id**: Optional venue filter
    """
    service = AnalyticsService(session)
    data = await service.get_revenue_analytics(period, date_from, date_to, venue_id)
    return RevenueMetrics(**data)

@router.get("/bookings", response_model=BookingMetrics)
async def get_booking_analytics(
    period: Annotated[str, Query()] = "month",
    date_from: Annotated[str | None, Query()] = None,
    date_to: Annotated[str | None, Query()] = None,
    venue_id: Annotated[str | None, Query()] = None,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
) -> BookingMetrics:
    """
    Get booking analytics with status breakdown.

    - **period**: Time granularity (day, week, month, quarter, year)
    - **date_from**: Start date (ISO format)
    - **date_to**: End date (ISO format)
    - **venue_id**: Optional venue filter
    """
    service = AnalyticsService(session)
    data = await service.get_booking_analytics(period, date_from, date_to, venue_id)
    return BookingMetrics(**data)

@router.get("/users", response_model=UserMetrics)
async def get_user_analytics(
    period: Annotated[str, Query()] = "month",
    date_from: Annotated[str | None, Query()] = None,
    date_to: Annotated[str | None, Query()] = None,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
) -> UserMetrics:
    """
    Get user analytics with growth metrics.

    - **period**: Time granularity (day, week, month, quarter, year)
    - **date_from**: Start date (ISO format)
    - **date_to**: End date (ISO format)
    """
    service = AnalyticsService(session)
    data = await service.get_user_analytics(period, date_from, date_to)
    return UserMetrics(**data)

@router.get("/venues", response_model=VenueMetrics)
async def get_venue_analytics(
    period: Annotated[str, Query()] = "month",
    date_from: Annotated[str | None, Query()] = None,
    date_to: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
) -> VenueMetrics:
    """
    Get venue analytics with top performers.

    - **period**: Time granularity (day, week, month, quarter, year)
    - **date_from**: Start date (ISO format)
    - **date_to**: End date (ISO format)
    - **limit**: Number of top venues to return (1-50)
    """
    service = AnalyticsService(session)
    data = await service.get_venue_analytics(period, date_from, date_to, limit)
    return VenueMetrics(**data)
```

### Step 4: Register Analytics Router

**File:** `backend/app/api/v1/api.py`

Add to imports:
```python
from app.api.v1.endpoints import analytics
```

Add to router:
```python
api_router.include_router(analytics.router)
```

---

## Success Criteria

- [ ] All analytics schemas created
- [ ] AnalyticsService with all aggregation methods
- [ ] All analytics endpoints functional
- [ ] Analytics router registered
- [ ] Time series data correctly formatted
- [ ] Tests passing (80%+ coverage)

---

## Testing

Write tests in `backend/tests/test_analytics.py`:

1. Revenue analytics aggregation
2. Booking analytics by status
3. User growth calculations
4. Venue performance rankings
5. Time series data generation
6. Period filtering (day/week/month)
7. Date range filtering
8. Venue-specific filtering
9. Access control (admin only)
