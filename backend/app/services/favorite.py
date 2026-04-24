import uuid
from sqlalchemy import select, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.favorite import UserFavorite
from app.models.venue import Venue


class FavoriteService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def toggle_favorite(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> bool:
        """
        Toggle favorite status for a venue.
        Returns: True if added, False if removed.
        """
        # Check if venue exists
        venue_exists = await self.session.execute(
            select(Venue.id).where(Venue.id == venue_id)
        )
        if not venue_exists.scalar():
            raise ValueError("Venue not found")

        # Check if already favorited
        stmt = select(UserFavorite).where(
            and_(UserFavorite.user_id == user_id, UserFavorite.venue_id == venue_id)
        )
        result = await self.session.execute(stmt)
        favorite = result.scalar_one_or_none()

        if favorite:
            # Remove from favorites
            await self.session.delete(favorite)
            await self.session.commit()
            return False
        else:
            # Add to favorites
            new_favorite = UserFavorite(user_id=user_id, venue_id=venue_id)
            self.session.add(new_favorite)
            await self.session.commit()
            return True

    async def get_user_favorite_ids(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        """Get a list of all venue IDs favorited by the user."""
        stmt = select(UserFavorite.venue_id).where(UserFavorite.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def is_favorite(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> bool:
        """Check if a specific venue is favorited by the user."""
        stmt = select(UserFavorite.id).where(
            and_(UserFavorite.user_id == user_id, UserFavorite.venue_id == venue_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None
