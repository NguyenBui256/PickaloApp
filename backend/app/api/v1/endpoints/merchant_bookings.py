"""
Merchant booking management API endpoints.

Handles booking approval, rejection, and venue booking management for merchants.
"""

import uuid
from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_merchant, DBSession
from app.models.user import User
from app.models.booking import Booking, BookingStatus, BookingSlot
from app.schemas.booking import (
    BookingResponse,
    BookingListItem,
    BookingListResponse,
    BookingApproveReject,
    BookingCancel,
    MerchantStatsResponse,
)
from app.services.booking import BookingService, get_booking_service

router = APIRouter(prefix="/merchant/bookings", tags=["merchant-bookings"])


@router.get("/stats", response_model=MerchantStatsResponse)
async def get_merchant_booking_stats(
    current_user: Annotated[User, Depends(get_current_merchant)],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> MerchantStatsResponse:
    """
    Get booking statistics and revenue for all merchant's venues.
    """
    stats = await booking_service.get_merchant_stats(merchant_id=current_user.id)
    return MerchantStatsResponse(**stats)


@router.get("", response_model=BookingListResponse)
async def list_merchant_bookings(
    current_user: Annotated[User, Depends(get_current_merchant)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    status: str | None = None,
    venue_id: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> BookingListResponse:
    """
    Get all bookings across merchant's venues.

    Returns paginated list with optional filters.
    """
    # Parse status if provided
    status_filter = None
    if status:
        try:
            status_filter = BookingStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}",
            )

    # Parse venue_id if provided
    venue_uuid = uuid.UUID(venue_id) if venue_id else None

    skip = (page - 1) * limit

    bookings, total = await booking_service.get_merchant_bookings(
        merchant_id=current_user.id,
        status=status_filter,
        venue_id=venue_uuid,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )

    items = [_booking_to_list_item(b) for b in bookings]
    pages = (total + limit - 1) // limit

    return BookingListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_merchant_booking(
    booking_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingResponse:
    """
    Get booking details.

    Merchant can view bookings for their venues.
    """
    from sqlalchemy.orm import selectinload

    booking = await booking_service.get_booking_by_id(
        uuid.UUID(booking_id),
        merchant_id=current_user.id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Reload with relations
    result = await session.execute(
        select(Booking)
        .options(
            selectinload(Booking.venue),
            selectinload(Booking.user),
            selectinload(Booking.slots).selectinload(BookingSlot.court),
            selectinload(Booking.booking_services),
        )
        .where(Booking.id == booking.id)
    )
    booking = result.scalar_one()

    return _booking_to_response(booking)


@router.post("/{booking_id}/approve", response_model=BookingResponse)
async def approve_booking(
    booking_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    approve_data: BookingApproveReject | None = None,
) -> BookingResponse:
    """
    Approve a pending booking.

    Merchant confirms the booking. Only works if booking is paid.
    """
    booking = await booking_service.approve_booking(
        uuid.UUID(booking_id),
        current_user.id,
    )

    await session.commit()
    await session.refresh(booking)

    return _booking_to_response(booking)


@router.post("/{booking_id}/complete", response_model=BookingResponse)
async def complete_booking(
    booking_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingResponse:
    """
    Mark a confirmed booking as completed.

    Merchant confirms that the session has ended.
    """
    try:
        booking = await booking_service.complete_booking(
            uuid.UUID(booking_id),
            current_user.id,
        )

        await session.commit()
        await session.refresh(booking)

        return _booking_to_response(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{booking_id}/reject", response_model=BookingResponse)
async def reject_booking(
    booking_id: str,
    reject_data: BookingApproveReject,
    current_user: Annotated[User, Depends(get_current_merchant)],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    session: DBSession,
) -> BookingResponse:
    """
    Reject a pending booking.

    Merchant declines the booking. Reason is optional but recommended.
    """
    booking = await booking_service.reject_booking(
        uuid.UUID(booking_id),
        current_user.id,
        reason=reject_data.reason,
    )

    await session.commit()
    await session.refresh(booking)

    return _booking_to_response(booking)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def merchant_cancel_booking(
    booking_id: str,
    cancel_data: BookingCancel,
    current_user: Annotated[User, Depends(get_current_merchant)],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    session: DBSession,
) -> BookingResponse:
    """
    Cancel a booking (merchant action).

    Merchants can cancel bookings (e.g., for maintenance).
    Reason is required for merchant cancellations.
    """
    booking = await booking_service.cancel_booking(
        uuid.UUID(booking_id),
        user_id=current_user.id,
        cancelled_by="MERCHANT",
        reason=cancel_data.reason or "Cancelled by merchant",
    )

    await session.commit()
    await session.refresh(booking)

    return _booking_to_response(booking)


@router.get("/venues/{venue_id}/bookings", response_model=list[BookingListItem])
async def get_venue_bookings(
    venue_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    booking_date: date | None = None,
    status: str | None = None,
) -> list[BookingListItem]:
    """
    Get bookings for a specific venue.

    Returns all bookings for the venue on a given date (if specified).
    """
    # Parse status if provided
    status_filter = None
    if status:
        try:
            status_filter = BookingStatus(status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}",
            )

    bookings = await booking_service.get_venue_bookings(
        uuid.UUID(venue_id),
        current_user.id,
        booking_date=booking_date,
        status=status_filter,
    )

    return [_booking_to_list_item(b) for b in bookings]


def _booking_to_response(booking: Any) -> BookingResponse:
    """Convert Booking model to BookingResponse schema."""
    services = []
    if hasattr(booking, 'booking_services') and booking.booking_services:
        for bs in booking.booking_services:
            services.append({
                "service_id": str(bs.service_id),
                "name": f"Service {bs.service_id}",
                "quantity": bs.quantity,
                "unit_price": bs.price_per_unit,
                "total": bs.total_price,
            })

    # Slots
    slots = []
    if hasattr(booking, 'slots') and booking.slots:
        for s in booking.slots:
            slots.append({
                "id": str(s.id),
                "court_id": str(s.court_id),
                "court_name": s.court.name if s.court else None,
                "start_time": s.start_time.strftime("%H:%M"),
                "end_time": s.end_time.strftime("%H:%M"),
                "price": s.price,
            })

    return BookingResponse(
        id=str(booking.id),
        user_id=str(booking.user_id),
        venue_id=str(booking.venue_id),
        booking_date=booking.booking_date.isoformat(),
        total_price=booking.total_price,
        status=booking.status,
        is_paid=booking.is_paid,
        is_cancelable=booking.is_cancelable,
        is_active=booking.is_active,
        payment_method=booking.payment_method,
        payment_id=booking.payment_id,
        paid_at=booking.paid_at.isoformat() if booking.paid_at else None,
        notes=booking.notes,
        cancelled_at=booking.cancelled_at.isoformat() if booking.cancelled_at else None,
        cancelled_by=booking.cancelled_by,
        created_at=booking.created_at.isoformat(),
        updated_at=booking.updated_at.isoformat(),
        venue_name=booking.venue.name if hasattr(booking, 'venue') and booking.venue else None,
        venue_address=booking.venue.address if hasattr(booking, 'venue') and booking.venue else None,
        slots=slots,
        services=services,
    )


def _booking_to_list_item(booking: Any) -> BookingListItem:
    """Convert Booking model to BookingListItem schema."""
    customer_name = None
    customer_phone = None
    if hasattr(booking, 'user') and booking.user:
        customer_name = booking.user.full_name
        customer_phone = booking.user.phone

    return BookingListItem(
        id=str(booking.id),
        venue_id=str(booking.venue_id),
        venue_name=booking.venue.name if hasattr(booking, 'venue') and booking.venue else None,
        venue_address=booking.venue.address if hasattr(booking, 'venue') and booking.venue else None,
        booking_date=booking.booking_date.isoformat(),
        total_price=booking.total_price,
        status=booking.status,
        is_paid=booking.is_paid,
        is_cancelable=booking.is_cancelable,
        created_at=booking.created_at.isoformat(),
        customer_name=customer_name,
        customer_phone=customer_phone,
    )
