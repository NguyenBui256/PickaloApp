import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, DBSession
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewListResponse,
)
from app.services.review import ReviewService, get_review_service

router = APIRouter()


@router.get("/venues/{venue_id}/reviews", response_model=ReviewListResponse)
async def list_venue_reviews(
    venue_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    review_service: ReviewService = Depends(get_review_service),
):
    """
    Get all reviews for a specific venue.
    """
    skip = (page - 1) * limit
    reviews, total = await review_service.get_venue_reviews(
        uuid.UUID(venue_id), skip=skip, limit=limit
    )

    return {
        "items": reviews,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.post("/venues/{venue_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_venue_review(
    venue_id: str,
    review_data: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    review_service: Annotated[ReviewService, Depends(get_review_service)],
    session: DBSession,
):
    """
    Submit a new review for a venue.
    
    Rule: Only users who have completed at least one booking at this venue can leave a rating.
    """
    try:
        review = await review_service.create_review(
            current_user.id, uuid.UUID(venue_id), review_data
        )
        # Need to commit because the service only does flush
        from app.core.database import async_session_factory
        # Usually dependencies handle this but let's be safe or use session from deps
        await session.commit()
        return review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    review_service: Annotated[ReviewService, Depends(get_review_service)],
    session: DBSession,
):
    """
    Update your own review.
    """
    try:
        review = await review_service.update_review(
            uuid.UUID(review_id), current_user.id, review_data
        )
        await session.commit()
        return review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    review_service: Annotated[ReviewService, Depends(get_review_service)],
    session: DBSession,
):
    """
    Delete your own review.
    """
    try:
        await review_service.delete_review(uuid.UUID(review_id), current_user.id)
        await session.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
