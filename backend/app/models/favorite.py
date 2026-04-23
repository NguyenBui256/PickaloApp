import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.venue import Venue


class UserFavorite(BaseModel):
    """
    Tracks venues that a user has added to their favorites.
    """
    __tablename__ = "user_favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    venue_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)

    # Constraint: A user can favorite a venue only once
    __table_args__ = (
        UniqueConstraint("user_id", "venue_id", name="uq_user_venue_favorite"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="favorites")
    venue: Mapped["Venue"] = relationship("Venue")

    def __repr__(self) -> str:
        return f"<UserFavorite(user_id={self.user_id}, venue_id={self.venue_id})>"
