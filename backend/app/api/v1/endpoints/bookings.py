"""
User booking API endpoints.

Handles booking creation, viewing, cancellation, price preview,
and availability timeline for users.
"""

import uuid
from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, DBSession
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingListItem,
    BookingListResponse,
    BookingPricePreview,
    BookingPriceResponse,
    BookingCancel,
    BookingTimelineResponse,
    TimeSlot,
)
from app.services.booking import BookingService, get_booking_service
from app.services.pricing import PricingService, get_pricing_service
from app.services.venue import VenueManagementService, get_venue_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/price-calculation", response_model=BookingPriceResponse)
async def calculate_booking_price(
    request: BookingPricePreview,
    session: DBSession,
    pricing_service: Annotated[PricingService, Depends(get_pricing_service)],
) -> BookingPriceResponse:
    """
    Calculate booking price preview.

    Returns detailed price breakdown without creating a booking.
    Useful for showing prices to users before they confirm.
    """
    # Convert service request to service IDs and quantities
    service_ids = None
    service_quantities = None

    if request.services:
        service_ids = [s.service_id for s in request.services]
        service_quantities = {s.service_id: s.quantity for s in request.services}

    # Calculate price
    pricing_result = await pricing_service.calculate_booking_total(
        venue_id=request.venue_id,
        booking_date=request.booking_date,
        start_time=request.start_time,
        end_time=request.end_time,
        service_ids=service_ids,
        service_quantities=service_quantities,
    )

    return BookingPriceResponse(**pricing_result)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    pricing_service: Annotated[PricingService, Depends(get_pricing_service)],
) -> BookingResponse:
    """
    Create a new booking.

    User creates a booking for a venue time slot.
    Status will be PENDING until merchant approves.
    """
    # Convert service requests
    service_ids = None
    service_quantities = None
    services_list = None

    if booking_data.services:
        service_ids = [s.service_id for s in booking_data.services]
        service_quantities = {s.service_id: s.quantity for s in booking_data.services}
        services_list = booking_data.services

    # Calculate price first
    pricing_result = await pricing_service.calculate_booking_total(
        venue_id=booking_data.venue_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        service_ids=service_ids,
        service_quantities=service_quantities,
    )

    # Create booking
    booking = await booking_service.create_booking(
        user_id=current_user.id,
        venue_id=booking_data.venue_id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        pricing_result=pricing_result,
        services=[s.model_dump() for s in services_list] if services_list else None,
        notes=booking_data.notes,
    )

    await session.commit()
    await session.refresh(booking)

    # Load relations for response
    from sqlalchemy.orm import selectinload

    result = await session.execute(
        select(Booking)
        .options(
            selectinload(Booking.venue),
            selectinload(Booking.booking_services),
        )
        .where(Booking.id == booking.id)
    )
    booking = result.scalar_one()

    return _booking_to_response(booking)


@router.get("", response_model=BookingListResponse)
async def list_my_bookings(
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> BookingListResponse:
    """
    Get current user's bookings.

    Returns paginated list of user's bookings with optional filters.
    """
    from app.models.booking import BookingStatus

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

    skip = (page - 1) * limit

    bookings, total = await booking_service.get_user_bookings(
        user_id=current_user.id,
        status=status_filter,
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
async def get_booking(
    booking_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingResponse:
    """
    Get booking details.

    Returns full booking information if user owns it.
    """
    from sqlalchemy.orm import selectinload

    booking = await booking_service.get_booking_by_id(
        uuid.UUID(booking_id),
        user_id=current_user.id,
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
            selectinload(Booking.booking_services),
        )
        .where(Booking.id == booking.id)
    )
    booking = result.scalar_one()

    return _booking_to_response(booking)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
    cancel_data: BookingCancel | None = None,
) -> BookingResponse:
    """
    Cancel a booking.

    Users can cancel their own PENDING or CONFIRMED bookings.
    Reason is optional but recommended.
    """
    booking = await booking_service.cancel_booking(
        booking_id=uuid.UUID(booking_id),
        user_id=current_user.id,
        cancelled_by="USER",
        reason=cancel_data.reason if cancel_data else None,
    )

    await session.commit()
    await session.refresh(booking)

    return _booking_to_response(booking)


@router.get("/venues/{venue_id}/timeline", response_model=BookingTimelineResponse)
async def get_venue_timeline(
    venue_id: str,
    date: Annotated[date, Query(description="Date to check (ISO 8601 format)")],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingTimelineResponse:
    """
    Get venue availability timeline for a date.

    Returns hourly slots showing availability and existing bookings.
    Public endpoint for browsing venues.
    """
    timeline = await booking_service.get_timeline_availability(
        uuid.UUID(venue_id),
        date,
    )

    return BookingTimelineResponse(**timeline)


def _booking_to_response(booking: Any) -> BookingResponse:
    """Convert Booking model to BookingResponse schema."""
    from sqlalchemy.orm import object_session

    # Ensure relations are loaded
    session = object_session(booking)
    if session:
        # Refresh to get relations if not already loaded
        from sqlalchemy.orm import selectinload
        result = session.execute(
            select(Booking)
            .options(
                selectinload(Booking.venue),
                selectinload(Booking.booking_services),
            )
            .where(Booking.id == booking.id)
        )
        booking = result.scalar_one()

    services = []
    if hasattr(booking, 'booking_services') and booking.booking_services:
        for bs in booking.booking_services:
            services.append({
                "service_id": str(bs.service_id),
                "name": f"Service {bs.service_id}",  # Will be populated from VenueManagementService
                "quantity": bs.quantity,
                "unit_price": bs.price_per_unit,
                "total": bs.total_price,
            })

    return BookingResponse(
        id=str(booking.id),
        user_id=str(booking.user_id),
        venue_id=str(booking.venue_id),
        booking_date=booking.booking_date.isoformat(),
        start_time=booking.start_time.strftime("%H:%M"),
        end_time=booking.end_time.strftime("%H:%M"),
        duration_minutes=booking.duration_minutes,
        base_price=booking.base_price,
        price_factor=booking.price_factor,
        service_fee=booking.service_fee,
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
        services=services,
    )


def _booking_to_list_item(booking: Any) -> BookingListItem:
    """Convert Booking model to BookingListItem schema."""
    return BookingListItem(
        id=str(booking.id),
        venue_id=str(booking.venue_id),
        venue_name=booking.venue.name if hasattr(booking, 'venue') and booking.venue else None,
        venue_address=booking.venue.address if hasattr(booking, 'venue') and booking.venue else None,
        booking_date=booking.booking_date.isoformat(),
        start_time=booking.start_time.strftime("%H:%M"),
        end_time=booking.end_time.strftime("%H:%M"),
        total_price=booking.total_price,
        status=booking.status,
        is_paid=booking.is_paid,
        is_cancelable=booking.is_cancelable,
        created_at=booking.created_at.isoformat(),
    )
