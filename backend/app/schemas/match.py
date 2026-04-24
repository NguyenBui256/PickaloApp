"""
Pydantic schemas for Matchmaking (Ghép Kèo).
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.match import MatchStatus, MatchSkillLevel, MatchRequestStatus
from app.schemas.user import UserResponse
from app.schemas.booking import BookingResponse


class MatchBase(BaseModel):
    slots_needed: int = Field(..., gt=0, description="Total number of slots needed")
    price_per_slot: Decimal = Field(..., ge=0, description="Price per slot to share")
    skill_level: MatchSkillLevel = Field(default=MatchSkillLevel.ALL)
    note: str | None = Field(default=None)


class MatchCreate(MatchBase):
    booking_id: uuid.UUID
    
    
class MatchUpdate(BaseModel):
    slots_needed: int | None = Field(None, gt=0)
    price_per_slot: Decimal | None = Field(None, ge=0)
    skill_level: MatchSkillLevel | None = None
    note: str | None = None
    status: MatchStatus | None = None


class MatchResponse(MatchBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    slots_filled: int
    status: MatchStatus
    created_at: datetime
    updated_at: datetime
    
    # We can't eagerly load a full BookingResponse because it might be heavy, but it helps frontend.
    booking: BookingResponse | None = None
    available_slots: int


# --- Match Requests ---

class MatchRequestBase(BaseModel):
    member_count: int = Field(default=1, gt=0, description="Number of members joining")


class MatchRequestCreate(MatchRequestBase):
    pass


class MatchRequestResponse(MatchRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
    requester_id: uuid.UUID
    status: MatchRequestStatus
    chat_room_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    
    requester: UserResponse | None = None
