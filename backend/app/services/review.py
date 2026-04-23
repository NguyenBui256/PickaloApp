import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import VenueReview
from app.models.venue import Venue
from app.models.booking import Booking, BookingStatus
from app.schemas.review import ReviewCreate, ReviewUpdate


class ReviewService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_review(
        self, 
        user_id: uuid.UUID, 
        venue_id: uuid.UUID, 
        review_data: ReviewCreate
    ) -> VenueReview:
        """
        Create a new review for a venue.
        
        Requires the user to have at least one COMPLETED booking at the venue.
        """
        # 1. Check if user has a COMPLETED booking at this venue
        booking_exists = await self.session.execute(
            select(Booking).where(
                and_(
                    Booking.user_id == user_id,
                    Booking.venue_id == venue_id,
                    Booking.status == BookingStatus.COMPLETED
                )
            ).limit(1)
        )
        
        if not booking_exists.scalar_one_or_none():
            raise ValueError("You must complete at least one booking at this venue before leaving a review.")

        # 2. Check if user already reviewed this venue
        existing_review = await self.session.execute(
            select(VenueReview).where(
                and_(VenueReview.user_id == user_id, VenueReview.venue_id == venue_id)
            )
        )
        if existing_review.scalar_one_or_none():
            raise ValueError("You have already reviewed this venue. Please update your existing review instead.")

        # 3. Create review
        review = VenueReview(
            user_id=user_id,
            venue_id=venue_id,
            rating=review_data.rating,
            comment=review_data.comment,
        )
        self.session.add(review)
        await self.session.flush()

        # 4. Update venue aggregate stats
        await self._update_venue_stats(venue_id)
        
        # Load user relations for response
        result = await self.session.execute(
            select(VenueReview)
            .options(selectinload(VenueReview.user))
            .where(VenueReview.id == review.id)
        )
        return result.scalar_one()

    async def update_review(
        self, 
        review_id: uuid.UUID, 
        user_id: uuid.UUID, 
        review_data: ReviewUpdate
    ) -> VenueReview:
        """Update a user's existing review and recalculate venue rating."""
        review_result = await self.session.execute(
            select(VenueReview).where(
                and_(VenueReview.id == review_id, VenueReview.user_id == user_id)
            )
        )
        review = review_result.scalar_one_or_none()
        if not review:
            raise ValueError("Review not found or you don't have permission to edit it.")

        if review_data.rating is not None:
            review.rating = review_data.rating
        if review_data.comment is not None:
            review.comment = review_data.comment

        await self.session.flush()
        
        # Recalculate stats if rating changed
        if review_data.rating is not None:
            await self._update_venue_stats(review.venue_id)

        # Reload with user relation
        result = await self.session.execute(
            select(VenueReview)
            .options(selectinload(VenueReview.user))
            .where(VenueReview.id == review.id)
        )
        return result.scalar_one()

    async def delete_review(self, review_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a review and update venue stats."""
        review_result = await self.session.execute(
            select(VenueReview).where(
                and_(VenueReview.id == review_id, VenueReview.user_id == user_id)
            )
        )
        review = review_result.scalar_one_or_none()
        if not review:
            raise ValueError("Review not found or you don't have permission to delete it.")

        venue_id = review.venue_id
        await self.session.delete(review)
        await self.session.flush()

        # Recalculate stats
        await self._update_venue_stats(venue_id)
        return True

    async def get_venue_reviews(
        self, 
        venue_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 10
    ) -> tuple[list[VenueReview], int]:
        """Get paginated reviews for a venue."""
        # Total count
        count_result = await self.session.execute(
            select(func.count(VenueReview.id)).where(VenueReview.venue_id == venue_id)
        )
        total = count_result.scalar() or 0

        # Reviews list
        result = await self.session.execute(
            select(VenueReview)
            .options(selectinload(VenueReview.user))
            .where(VenueReview.venue_id == venue_id)
            .order_by(VenueReview.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def _update_venue_stats(self, venue_id: uuid.UUID):
        """Internal helper to recalculate average rating and total reviews for a venue."""
        stats_result = await self.session.execute(
            select(
                func.avg(VenueReview.rating),
                func.count(VenueReview.id)
            ).where(VenueReview.venue_id == venue_id)
        )
        avg_rating, review_count = stats_result.one()
        
        # Update venue
        venue_result = await self.session.execute(
            select(Venue).where(Venue.id == venue_id)
        )
        venue = venue_result.scalar_one_or_none()
        if venue:
            venue.rating = float(avg_rating) if avg_rating else 0.0
            venue.review_count = review_count or 0


from app.api.deps import DBSession

def get_review_service(session: DBSession):
    return ReviewService(session)
