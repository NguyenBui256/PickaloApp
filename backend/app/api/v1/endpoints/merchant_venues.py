"""
Merchant venue list endpoint.

Returns venues owned by the authenticated merchant with booking stats.
"""

import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_merchant, DBSession
from app.models.user import User
from app.models.venue import Venue
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import MerchantVenueStats

router = APIRouter()


@router.get("/venues", response_model=list[MerchantVenueStats])
async def get_merchant_venues(
    current_user: Annotated[User, Depends(get_current_merchant)],
    session: DBSession,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[MerchantVenueStats]:
    """
    Get all venues owned by the current merchant.

    Returns venue list with booking counts and revenue stats.
    """
    skip = (page - 1) * limit

    # Get merchant's venues
    result = await session.execute(
        select(Venue)
        .where(
            Venue.merchant_id == current_user.id,
            Venue.deleted_at.is_(None),
        )
        .order_by(Venue.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    venues = list(result.scalars().all())

    items = []
    for venue in venues:
        # Count bookings this month
        booking_count_result = await session.execute(
            select(func.count()).select_from(Booking).where(
                Booking.venue_id == venue.id,
                Booking.status.in_([
                    BookingStatus.CONFIRMED,
                    BookingStatus.COMPLETED,
                ]),
            )
        )
        total_bookings = booking_count_result.scalar() or 0

        # Sum revenue
        revenue_result = await session.execute(
            select(func.coalesce(func.sum(Booking.total_price), 0)).where(
                Booking.venue_id == venue.id,
                Booking.status.in_([
                    BookingStatus.CONFIRMED,
                    BookingStatus.COMPLETED,
                ]),
            )
        )
        revenue_mtd = revenue_result.scalar() or Decimal("0")

        items.append(MerchantVenueStats(
            id=str(venue.id),
            name=venue.name,
            status="ACTIVE" if venue.is_active else "PENDING",
            total_bookings=total_bookings,
            revenue_mtd=revenue_mtd,
            rating=float(venue.rating) if venue.rating else 0.0,
        ))

    return items
