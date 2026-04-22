import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, Numeric, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.venue import Venue


class VenueReview(Base):
    """
    User reviews and ratings for venues.
    
    Users can only leave one review per venue after a completed booking.
    """
    __tablename__ = "venue_reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    venue_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5 stars
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True) # List of image URLs
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraint: One review per user per venue
    __table_args__ = (
        UniqueConstraint("user_id", "venue_id", name="uq_user_venue_review"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    venue: Mapped["Venue"] = relationship("Venue", back_populates="reviews")

    def __repr__(self) -> str:
        return f"<VenueReview(id={self.id}, rating={self.rating}, user_id={self.user_id}, venue_id={self.venue_id})>"
