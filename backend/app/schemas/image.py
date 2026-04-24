"""Image upload response schemas."""

from pydantic import BaseModel


class ImageUploadResponse(BaseModel):
    """Response for single image upload."""
    url: str
    filename: str
    message: str


class MultipleImageUploadResponse(BaseModel):
    """Response for multiple image uploads."""
    urls: list[str]
    count: int
    message: str