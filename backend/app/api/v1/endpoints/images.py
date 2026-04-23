"""
Image upload and management endpoints.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy import select, update

from app.api.deps import get_current_user, get_current_merchant, DBSession, StorageServiceDep
from app.models.user import User
from app.models.venue import Venue
from app.models.court import Court
from app.schemas.image import ImageUploadResponse, MultipleImageUploadResponse

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/avatar", response_model=ImageUploadResponse)
async def upload_user_avatar(
    current_user: Annotated[User, Depends(get_current_user)],
    storage: StorageServiceDep,
    session: DBSession,
    file: UploadFile = File(...),
) -> ImageUploadResponse:
    """
    Upload user avatar image.

    Requires authentication. Updates user's avatar_url field.
    """
    # Upload image to MinIO
    avatar_url = await storage.upload_user_avatar(current_user.id, file)

    # Update user's avatar_url in database
    await session.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(avatar_url=avatar_url)
    )
    await session.commit()

    return ImageUploadResponse(
        url=avatar_url,
        filename=file.filename or "avatar",
        message="Avatar uploaded successfully"
    )


@router.post("/venues/{venue_id}", response_model=MultipleImageUploadResponse)
async def upload_venue_images(
    venue_id: UUID,
    current_user: Annotated[User, Depends(get_current_merchant)],
    storage: StorageServiceDep,
    session: DBSession,
    files: list[UploadFile] = File(...),
) -> MultipleImageUploadResponse:
    """
    Upload venue images.

    Requires merchant authentication and venue ownership.
    """
    # Verify venue ownership
    result = await session.execute(
        select(Venue).where(
            Venue.id == venue_id,
            Venue.deleted_at.is_(None),
        )
    )
    venue = result.scalar_one_or_none()

    if not venue or not current_user.can_manage_venue(venue_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Venue not found or access denied"
        )

    # Upload images to MinIO
    image_urls = await storage.upload_venue_images(venue_id, files)

    # Update venue's images in database
    existing_images = venue.images or []
    updated_images = existing_images + image_urls

    await session.execute(
        update(Venue)
        .where(Venue.id == venue_id)
        .values(images=updated_images)
    )
    await session.commit()

    return MultipleImageUploadResponse(
        urls=image_urls,
        count=len(image_urls),
        message=f"Successfully uploaded {len(image_urls)} venue images"
    )


@router.post("/courts/{court_id}", response_model=MultipleImageUploadResponse)
async def upload_court_images(
    court_id: UUID,
    current_user: Annotated[User, Depends(get_current_merchant)],
    storage: StorageServiceDep,
    session: DBSession,
    files: list[UploadFile] = File(...),
) -> MultipleImageUploadResponse:
    """
    Upload court images.

    Requires merchant authentication and court ownership.
    """
    # Verify court ownership through venue
    result = await session.execute(
        select(Court)
        .join(Venue)
        .where(
            Court.id == court_id,
            Court.deleted_at.is_(None),
        )
    )
    court = result.scalar_one_or_none()

    if not court or not current_user.can_manage_venue(court.venue_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Court not found or access denied"
        )

    # Upload images to MinIO
    image_urls = await storage.upload_court_images(court_id, files)

    # Update court's images in database
    existing_images = court.images or []
    updated_images = existing_images + image_urls

    await session.execute(
        update(Court)
        .where(Court.id == court_id)
        .values(images=updated_images)
    )
    await session.commit()

    return MultipleImageUploadResponse(
        urls=image_urls,
        count=len(image_urls),
        message=f"Successfully uploaded {len(image_urls)} court images"
    )


@router.delete("/{image_url:path}")
async def delete_image(
    image_url: str,
    current_user: Annotated[User, Depends(get_current_user)],
    storage: StorageServiceDep,
) -> dict:
    """
    Delete an image from storage.

    Requires authentication. Users can only delete their own images.
    """
    # TODO: Verify image ownership (check if image belongs to user)
    # This would need additional logic to verify ownership

    success = storage.delete_image(image_url)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete image"
        )

    return {"message": "Image deleted successfully"}