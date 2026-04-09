"""
Analytics API endpoints.

Provides analytics data for admin dashboard including
revenue trends, booking statistics, user growth, and venue performance.
All endpoints require admin role.
"""

from typing import Annotated
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin, DBSession
from app.models.user import User
from app.schemas.analytics import (
    RevenueTrendResponse,
    BookingStatsResponse,
    UserGrowthResponse,
    VenuePerformanceResponse,
    AnalyticsPeriod,
)

router = APIRouter(prefix="/admin/analytics", tags=["analytics"])


@router.get("/revenue", response_model=RevenueTrendResponse)
async def get_revenue_trends(
    admin: Annotated[User, Depends(get_admin)],
    start_date: date = Query(..., description="Start date for analytics"),
    end_date: date | None = None,
    period_type: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    analytics_service: Annotated["AnalyticsService", Depends(get_analytics_service)],
) -> RevenueTrendResponse:
    """
    Get revenue trends for a time period.

    - **start_date**: Start date for analytics period
    - **end_date**: End date (defaults to today)
    - **period_type**: Granularity - daily, weekly, or monthly

    Requires admin role.

    Note: Revenue data will be available after payment system implementation.
    """
    if end_date is None:
        end_date = date.today()

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )

    # Limit date range to prevent excessive queries
    max_days = 365
    if (end_date - start_date).days > max_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date range cannot exceed {max_days} days",
        )

    from app.services.analytics import AnalyticsService
    trends = await analytics_service.get_revenue_trends(
        start_date=start_date,
        end_date=end_date,
        period_type=period_type,
    )

    return RevenueTrendResponse(**trends)


@router.get("/bookings", response_model=BookingStatsResponse)
async def get_booking_statistics(
    admin: Annotated[User, Depends(get_admin)],
    start_date: date = Query(..., description="Start date for analytics"),
    end_date: date | None = None,
    analytics_service: Annotated["AnalyticsService", Depends(get_analytics_service)],
) -> BookingStatsResponse:
    """
    Get booking statistics for a time period.

    - **start_date**: Start date for analytics period
    - **end_date**: End date (defaults to today)

    Requires admin role.

    Returns booking counts, completion rates, popular time slots, and daily breakdown.
    """
    if end_date is None:
        end_date = date.today()

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )

    from app.services.analytics import AnalyticsService
    stats = await analytics_service.get_booking_statistics(
        start_date=start_date,
        end_date=end_date,
    )

    return BookingStatsResponse(**stats)


@router.get("/users", response_model=UserGrowthResponse)
async def get_user_growth(
    admin: Annotated[User, Depends(get_admin)],
    start_date: date = Query(..., description="Start date for analytics"),
    end_date: date | None = None,
    analytics_service: Annotated["AnalyticsService", Depends(get_analytics_service)],
) -> UserGrowthResponse:
    """
    Get user growth analytics for a time period.

    - **start_date**: Start date for analytics period
    - **end_date**: End date (defaults to today)

    Requires admin role.

    Returns total users, new signups, active users, growth rate, and role breakdown.
    """
    if end_date is None:
        end_date = date.today()

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )

    from app.services.analytics import AnalyticsService
    growth = await analytics_service.get_user_growth(
        start_date=start_date,
        end_date=end_date,
    )

    return UserGrowthResponse(**growth)


@router.get("/venues", response_model=VenuePerformanceResponse)
async def get_venue_performance(
    admin: Annotated[User, Depends(get_admin)],
    start_date: date = Query(..., description="Start date for analytics"),
    end_date: date | None = None,
    limit: int = Query(10, ge=1, le=100, description="Number of top venues to return"),
    analytics_service: Annotated["AnalyticsService", Depends(get_analytics_service)],
) -> VenuePerformanceResponse:
    """
    Get venue performance rankings.

    - **start_date**: Start date for analytics period
    - **end_date**: End date (defaults to today)
    - **limit**: Number of top venues to return (max 100)

    Requires admin role.

    Returns top performing venues by booking count and venue type breakdown.
    """
    if end_date is None:
        end_date = date.today()

    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )

    from app.services.analytics import AnalyticsService
    performance = await analytics_service.get_venue_performance(
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )

    return VenuePerformanceResponse(**performance)


# Import at module level for dependency
from app.services.analytics import get_analytics_service
