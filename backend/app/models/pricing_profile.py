import uuid
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Time, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from app.models.venue import DayType

class PricingProfile(BaseModel):
    """
    Template for pricing configurations that can be applied to venues.
    """
    __tablename__ = "pricing_profiles"

    merchant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    slots: Mapped[list["PricingProfileSlot"]] = relationship(
        "PricingProfileSlot",
        back_populates="profile",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

class PricingProfileSlot(BaseModel):
    """
    Time slots within a pricing profile.
    """
    __tablename__ = "pricing_profile_slots"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pricing_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_type: Mapped[DayType] = mapped_column(String(20), nullable=False)
    # New: days of week (0=Mon, ..., 6=Sun)
    days_of_week: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    start_time: Mapped[str] = mapped_column(Time, nullable=False)
    end_time: Mapped[str] = mapped_column(Time, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    profile: Mapped["PricingProfile"] = relationship("PricingProfile", back_populates="slots")
