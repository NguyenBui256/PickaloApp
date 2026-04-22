import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.venue import Venue
    from app.models.booking import BookingSlot

class Court(BaseModel):
    """
    Sub-venue or specific court within a Venue (e.g., Court 1, Court 2).
    """
    __tablename__ = "courts"

    venue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="courts")
    booking_slots: Mapped[list["BookingSlot"]] = relationship(
        "BookingSlot",
        back_populates="court",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Court(id={self.id}, name='{self.name}', venue_id={self.venue_id})>"
