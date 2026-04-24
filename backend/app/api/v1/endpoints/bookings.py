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
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, DBSession
from app.models.user import User
from app.models.booking import Booking, BookingStatus, BookingSlot
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingListItem,
    BookingListResponse,
    BookingPricePreview,
    BookingPriceResponse,
    BookingCancel,
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

    # Calculate total price
    pricing_result = await pricing_service.calculate_multi_slot_total(
        venue_id=request.venue_id,
        slots=[{
            "date": request.booking_date,
            "court_id": s.court_id,
            "start_time": s.start_time,
            "end_time": s.end_time,
        } for s in request.slots],
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

    # Calculate multi-slot price
    pricing_result = await pricing_service.calculate_multi_slot_total(
        venue_id=booking_data.venue_id,
        slots=[{
            "date": booking_data.booking_date,
            "court_id": s.court_id,
            "start_time": s.start_time,
            "end_time": s.end_time
        } for s in booking_data.slots],
        service_ids=service_ids,
        service_quantities=service_quantities,
    )

    # Flatten slot list for service creation (adding calculated price per slot)
    slots_to_create = []
    for i, s in enumerate(booking_data.slots):
        slots_to_create.append({
            "court_id": s.court_id,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "price": pricing_result["slots"][i]["pricing"]["total"]
        })

    # Create booking
    booking = await booking_service.create_booking(
        user_id=current_user.id,
        venue_id=booking_data.venue_id,
        booking_date=booking_data.booking_date,
        slots_data=slots_to_create,
        total_price=pricing_result["total"],
        services=[s.model_dump() for s in services_list] if services_list else None,
        notes=booking_data.notes,
        payment_proof=booking_data.payment_proof,
    )

    await session.commit()
    await session.refresh(booking)

    # Load relations for response
    from sqlalchemy.orm import selectinload

    result = await session.execute(
        select(Booking)
        .options(
            selectinload(Booking.venue),
            selectinload(Booking.slots).selectinload(BookingSlot.court),
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
            selectinload(Booking.slots).selectinload(BookingSlot.court),
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




def _booking_to_response(booking: Any) -> BookingResponse:
    """Convert Booking model to BookingResponse schema."""
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
        payment_proof=booking.payment_proof,
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
        has_match=booking.match is not None if hasattr(booking, 'match') else False,
        created_at=booking.created_at.isoformat(),
        payment_proof=booking.payment_proof,
        start_time=booking.slots[0].start_time.strftime("%H:%M") if booking.slots and booking.slots[0].start_time else None,
        end_time=booking.slots[0].end_time.strftime("%H:%M") if booking.slots and booking.slots[0].end_time else None,
        court_name=booking.slots[0].court.name if booking.slots and hasattr(booking.slots[0], 'court') and booking.slots[0].court else None,
    )
