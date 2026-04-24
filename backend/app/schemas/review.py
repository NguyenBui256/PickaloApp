import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ReviewBase(BaseModel):
    """Base review schema."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: str | None = Field(None, max_length=1000)


class ReviewCreate(ReviewBase):
    """Schema for creating a review."""
    pass


class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = Field(None, max_length=1000)


class ReviewUser(BaseModel):
    """Minimal user info for review display."""
    id: uuid.UUID
    full_name: str
    avatar_url: str | None = None


class ReviewResponse(ReviewBase):
    """Full review response."""
    id: uuid.UUID
    venue_id: uuid.UUID
    user: ReviewUser
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    """Paginated list of reviews."""
    items: list[ReviewResponse]
    total: int
    page: int
    limit: int
    pages: int
