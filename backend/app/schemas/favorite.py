import uuid
from datetime import datetime
from pydantic import BaseModel


class FavoriteBase(BaseModel):
    """Base favorite schema."""
    venue_id: uuid.UUID


class FavoriteToggleResponse(BaseModel):
    """Response after toggling a favorite status."""
    venue_id: uuid.UUID
    is_favorite: bool
    message: str


class FavoriteResponse(BaseModel):
    """Full favorite detailed response."""
    id: uuid.UUID
    user_id: uuid.UUID
    venue_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
