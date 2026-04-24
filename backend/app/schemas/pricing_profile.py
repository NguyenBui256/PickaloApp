import uuid
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Annotated
from app.models.venue import DayType

class PricingProfileSlotBase(BaseModel):
    """Base schema for pricing profile slots."""
    day_type: DayType
    days_of_week: list[int] | None = None
    start_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    end_time: Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]
    price: Annotated[Decimal, Field(ge=Decimal("0"))]
    is_default: bool = False

class PricingProfileSlotCreate(PricingProfileSlotBase):
    """Schema for creating a pricing profile slot."""
    pass

class PricingProfileSlotResponse(PricingProfileSlotBase):
    """Schema for pricing profile slot response."""
    id: str
    profile_id: str

    class Config:
        from_attributes = True

class PricingProfileBase(BaseModel):
    """Base schema for pricing profiles."""
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None

class PricingProfileCreate(PricingProfileBase):
    """Schema for creating a pricing profile."""
    slots: list[PricingProfileSlotCreate] = []

class PricingProfileUpdate(BaseModel):
    """Schema for updating a pricing profile."""
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None

class PricingProfileResponse(PricingProfileBase):
    """Schema for pricing profile response."""
    id: str
    merchant_id: str
    slots: list[PricingProfileSlotResponse]

    class Config:
        from_attributes = True
