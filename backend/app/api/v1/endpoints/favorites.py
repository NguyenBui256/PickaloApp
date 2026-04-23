import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_active_user, DBSession
from app.models.user import User
from app.schemas.favorite import FavoriteToggleResponse, FavoriteResponse
from app.schemas.venue import VenueListResponse, Coordinates, VenueListItem
from app.services.favorite import FavoriteService
from app.services.venue import VenueManagementService

router = APIRouter()


@router.post("/toggle/{venue_id}", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    venue_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: DBSession,
):
    """
    Toggle favorite status for a venue.
    """
    favorite_service = FavoriteService(session)
    try:
        is_added = await favorite_service.toggle_favorite(current_user.id, venue_id)
        return FavoriteToggleResponse(
            venue_id=venue_id,
            is_favorite=is_added,
            message="Sân đã được thêm vào danh sách yêu thích" if is_added else "Sân đã được xóa khỏi danh sách yêu thích"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("", response_model=VenueListResponse)
async def get_favorite_venues(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: DBSession,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get list of venues favorited by the current user.
    """
    venue_service = VenueManagementService(session)
    skip = (page - 1) * limit
    
    venues, total = await venue_service.get_venues(
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        only_favorites=True
    )
    
    # Convert to list items manually to handle location coordinates
    items = []
    for venue, is_fav in venues:
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
            is_favorite=is_fav,
            images=venue.images,
            amenities=venue.amenities,
            logo=venue.logo if hasattr(venue, 'logo') else None,
            bookingLink=None,
            rating=float(venue.rating or 0.0),
            review_count=venue.review_count or 0
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
