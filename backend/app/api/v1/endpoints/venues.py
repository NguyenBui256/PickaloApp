"""
Venue API endpoints.

Handles venue CRUD, search, availability, and management for merchants.
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    get_current_merchant,
    get_admin,
    verify_venue_ownership,
    DBSession,
)
from app.models.user import User
from app.models.venue import VenueType, DayType
from app.schemas.venue import (
    VenueCreate,
    VenueUpdate,
    VenueResponse,
    VenueListItem,
    VenueListResponse,
    VenueSearchParams,
    AvailabilityRequest,
    AvailabilityResponse,
    VenueServiceCreate,
    VenueServiceUpdate,
    VenueServiceResponse,
    Coordinates,
    CourtCreate,
    CourtUpdate,
    CourtResponse,
    PricingSlotCreate,
    PricingSlotUpdate,
    PricingSlotResponse,
)
from app.services.venue import VenueService, get_venue_service
from app.services.booking import BookingService, get_booking_service

router = APIRouter(prefix="/venues", tags=["venues"])


# ===== Public/User Endpoints =====

@router.get("", response_model=VenueListResponse)
async def list_venues(
    session: DBSession,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    district: str | None = None,
    venue_type: VenueType | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> VenueListResponse:
    """
    List venues with optional filters.

    Public endpoint for browsing available venues.
    """
    skip = (page - 1) * limit

    venues, total = await venue_service.get_venues(
        district=district,
        venue_type=venue_type,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit,
    )

    # Convert to list items
    items = []
    for venue in venues:
        items.append(VenueListItem(
            id=str(venue.id),
            name=venue.name,
            address=venue.address,
            district=venue.district,
            fullAddress=venue.address,
            venue_type=venue.venue_type,
            category=venue.venue_type.value if hasattr(venue.venue_type, 'value') else str(venue.venue_type),
            location=Coordinates(lat=venue.latitude or 0.0, lng=venue.longitude or 0.0),
            base_price_per_hour=venue.base_price_per_hour,
            is_verified=venue.is_verified,
            images=venue.images,
            amenities=venue.amenities,
            logo=None,
            bookingLink=None,
            rating=venue.rating,
            review_count=venue.review_count
        ))

    pages = (total + limit - 1) // limit

    return VenueListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/search/nearby", response_model=VenueListResponse)
async def search_venues_nearby(
    session: DBSession,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    radius: Annotated[float, Query(ge=100, le=50000)] = 5000,
    venue_type: VenueType | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> VenueListResponse:
    """
    Search venues within radius using PostGIS geospatial query.

    Finds venues near the given coordinates, ordered by distance.
    """
    skip = (page - 1) * limit

    venues, total = await venue_service.search_venues_by_radius(
        lat=lat,
        lng=lng,
        radius=radius,
        venue_type=venue_type,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit,
    )

    # Convert to list items
    items = []
    for venue in venues:
        items.append(VenueListItem(
            id=str(venue.id),
            name=venue.name,
            address=venue.address,
            district=venue.district,
            fullAddress=venue.address,
            venue_type=venue.venue_type,
            category=venue.venue_type.value if hasattr(venue.venue_type, 'value') else str(venue.venue_type),
            location=Coordinates(lat=venue.latitude or 0.0, lng=venue.longitude or 0.0),
            base_price_per_hour=venue.base_price_per_hour,
            is_verified=venue.is_verified,
            images=venue.images,
            amenities=venue.amenities,
            logo=None,
            bookingLink=None,
            rating=venue.rating,
            review_count=venue.review_count
        ))

    pages = (total + limit - 1) // limit

    return VenueListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: str,
    session: DBSession,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
) -> VenueResponse:
    """
    Get venue details by ID.

    Public endpoint for viewing venue information.
    """
    venue = await venue_service.get_venue_by_id(uuid.UUID(venue_id))

    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found",
        )

    # Build response
    return VenueResponse(
        id=str(venue.id),
        merchant_id=str(venue.merchant_id),
        name=venue.name,
        address=venue.address,
        district=venue.district,
        fullAddress=venue.address,
        location=Coordinates(lat=venue.latitude or 0.0, lng=venue.longitude or 0.0),
        venue_type=venue.venue_type,
        category=venue.venue_type.value if hasattr(venue.venue_type, 'value') else str(venue.venue_type),
        description=venue.description,
        logo=None,
        rating=venue.rating,
        review_count=venue.review_count,
        bookingLink=None,
        images=venue.images,
        operating_hours={"open": "06:00", "close": "22:00"},
        amenities=venue.amenities,
        base_price_per_hour=venue.base_price_per_hour,
        is_active=venue.is_active,
        is_verified=venue.is_verified,
        created_at=venue.created_at.isoformat(),
        updated_at=venue.updated_at.isoformat(),
    )


@router.get("/{venue_id}/availability", response_model=AvailabilityResponse)
async def get_venue_availability(
    venue_id: str,
    date: Annotated[date, Query(description="ISO 8601 date format (YYYY-MM-DD)")],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> AvailabilityResponse:
    """
    Check venue availability for a given date.

    Returns grid of slots grouped by court.
    """
    availability = await booking_service.get_timeline_availability(
        uuid.UUID(venue_id),
        date,
    )

    return AvailabilityResponse(**availability)


@router.get("/districts/list")
async def list_hanoi_districts(
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
) -> dict[str, list[str]]:
    """
    Get list of Hanoi districts for filtering.

    Returns all available districts for venue search.
    """
    districts = await venue_service.get_hanoi_districts()
    return {"districts": districts}


# ===== Merchant Endpoints =====

@router.post("/merchant", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    venue_data: VenueCreate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> VenueResponse:
    """
    Create a new venue (merchant only).

    Merchants can register their sports facilities.
    """
    venue = await venue_service.create_venue(
        merchant_id=current_user.id,
        name=venue_data.name,
        address=venue_data.address,
        district=venue_data.district,
        coordinates=venue_data.coordinates.model_dump(),
        venue_type=venue_data.venue_type,
        base_price_per_hour=venue_data.base_price_per_hour,
        description=venue_data.description,
        images=venue_data.images,
        operating_hours=venue_data.operating_hours,
        amenities=venue_data.amenities,
    )

    await session.commit()
    await session.refresh(venue)

    return VenueResponse(
        id=str(venue.id),
        merchant_id=str(venue.merchant_id),
        name=venue.name,
        address=venue.address,
        district=venue.district,
        fullAddress=venue.address,
        location=venue_data.coordinates,
        venue_type=venue.venue_type,
        category=venue.venue_type.value if hasattr(venue.venue_type, 'value') else str(venue.venue_type),
        description=venue.description,
        images=venue.images,
        operating_hours={"open": "06:00", "close": "22:00"},
        amenities=venue.amenities,
        base_price_per_hour=float(venue.base_price_per_hour),
        is_active=venue.is_active,
        is_verified=venue.is_verified,
        logo=None,
        bookingLink=None,
        rating=None,
        created_at=venue.created_at.isoformat(),
        updated_at=venue.updated_at.isoformat(),
    )


@router.put("/merchant/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: str,
    venue_data: VenueUpdate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> VenueResponse:
    """
    Update venue details (merchant only, ownership verified).

    Only venue owners can modify their venues.
    """
    # Build update dict from non-None fields
    updates = venue_data.model_dump(exclude_unset=True)

    venue = await venue_service.update_venue(
        venue_id=uuid.UUID(venue_id),
        merchant_id=current_user.id,
        **updates,
    )

    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found",
        )

    await session.commit()
    await session.refresh(venue)

    return VenueResponse(
        id=str(venue.id),
        merchant_id=str(venue.merchant_id),
        name=venue.name,
        address=venue.address,
        district=venue.district,
        location=Coordinates(lat=0, lng=0),
        venue_type=venue.venue_type,
        description=venue.description,
        images=venue.images,
        operating_hours=venue.operating_hours,
        amenities=venue.amenities,
        base_price_per_hour=venue.base_price_per_hour,
        is_active=venue.is_active,
        is_verified=venue.is_verified,
        created_at=venue.created_at.isoformat(),
        updated_at=venue.updated_at.isoformat(),
    )


@router.delete("/merchant/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_venue(
    venue_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> None:
    """
    Deactivate venue (merchant only, ownership verified).

    Soft delete - venue is marked inactive but data is preserved.
    """
    success = await venue_service.deactivate_venue(
        venue_id=uuid.UUID(venue_id),
        merchant_id=current_user.id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found",
        )

    await session.commit()


@router.get("/{venue_id}/services", response_model=list[VenueServiceResponse])
async def get_venue_services(
    venue_id: str,
    session: DBSession,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
) -> list[VenueServiceResponse]:
    """
    Get venue services (public).

    Returns additional services offered by the venue.
    """
    services = await venue_service.get_venue_services(uuid.UUID(venue_id))

    return [
        VenueServiceResponse(
            id=s.id,
            venue_id=str(s.venue_id),
            name=s.name,
            description=s.description,
            price_per_unit=s.price_per_unit,
            is_available=s.is_available,
            created_at=s.created_at.isoformat(),
        )
        for s in services
    ]


@router.post("/{venue_id}/services", response_model=VenueServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_venue_service(
    venue_id: str,
    service_data: VenueServiceCreate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> VenueServiceResponse:
    """
    Add service to venue (merchant only, ownership verified).
    """
    service = await venue_service.create_venue_service(
        venue_id=uuid.UUID(venue_id),
        merchant_id=current_user.id,
        name=service_data.name,
        price_per_unit=service_data.price_per_unit,
        description=service_data.description,
    )

    await session.commit()

    return VenueServiceResponse(
        id=service.id,
        venue_id=str(service.venue_id),
        name=service.name,
        description=service.description,
        price_per_unit=service.price_per_unit,
        is_available=service.is_available,
        created_at=service.created_at.isoformat(),
    )


@router.get("/{venue_id}/pricing", response_model=list[PricingSlotResponse])
async def get_pricing_slots(
    venue_id: str,
    session: DBSession,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
) -> list[PricingSlotResponse]:
    """
    Get venue pricing slots (public).

    Returns dynamic pricing configuration.
    """
    slots = await venue_service.get_pricing_slots(uuid.UUID(venue_id))

    return [
        PricingSlotResponse(
            id=slot.id,
            venue_id=str(slot.venue_id),
            day_type=slot.day_type,
            start_time=slot.start_time.strftime("%H:%M"),
            end_time=slot.end_time.strftime("%H:%M"),
            price_factor=slot.price_factor,
        )
        for slot in slots
    ]


@router.post("/{venue_id}/pricing", response_model=PricingSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_pricing_slot(
    venue_id: str,
    slot_data: PricingSlotCreate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> PricingSlotResponse:
    """
    Add pricing slot (merchant only, ownership verified).
    """
    slot = await venue_service.create_pricing_slot(
        venue_id=uuid.UUID(venue_id),
        merchant_id=current_user.id,
        day_type=slot_data.day_type,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        price_factor=slot_data.price_factor,
    )

    await session.commit()

    return PricingSlotResponse(
        id=slot.id,
        venue_id=str(slot.venue_id),
        day_type=slot.day_type,
        start_time=slot.start_time.strftime("%H:%M"),
        end_time=slot.end_time.strftime("%H:%M"),
        price_factor=slot.price_factor,
    )


# ===== Admin Endpoints =====

@router.post("/{venue_id}/verify")
async def verify_venue(
    venue_id: str,
    current_user: Annotated[User, Depends(get_admin)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> dict[str, str]:
    """
    Verify venue (admin only).

    Admin can verify venues after review.
    """
    success = await venue_service.verify_venue(uuid.UUID(venue_id))

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found",
        )

    await session.commit()

    return {"message": "Venue verified successfully"}


# ===== Court Management Endpoints =====

@router.get("/{venue_id}/courts", response_model=list[CourtResponse])
async def get_venue_courts(
    venue_id: str,
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
) -> list[CourtResponse]:
    """Get all courts for a venue."""
    courts = await venue_service.get_venue_courts(uuid.UUID(venue_id))
    return [CourtResponse.model_validate(c) for c in courts]


@router.post("/{venue_id}/courts", response_model=CourtResponse, status_code=status.HTTP_201_CREATED)
async def create_court(
    venue_id: str,
    court_data: CourtCreate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> CourtResponse:
    """Add a new court to venue (merchant only)."""
    court = await venue_service.create_court(
        venue_id=uuid.UUID(venue_id),
        merchant_id=current_user.id,
        name=court_data.name,
        is_active=court_data.is_active,
    )
    await session.commit()
    return CourtResponse.model_validate(court)


@router.put("/courts/{court_id}", response_model=CourtResponse)
async def update_court(
    court_id: str,
    court_data: CourtUpdate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueService, Depends(get_venue_service)],
    session: DBSession,
) -> CourtResponse:
    """Update court details (merchant only)."""
    updates = court_data.model_dump(exclude_unset=True)
    court = await venue_service.update_court(
        court_id=uuid.UUID(court_id),
        merchant_id=current_user.id,
        **updates,
    )
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    await session.commit()
    return CourtResponse.model_validate(court)
