import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_merchant, DBSession
from app.models.user import User
from app.schemas.pricing_profile import (
    PricingProfileCreate,
    PricingProfileUpdate,
    PricingProfileResponse,
)
from app.services.venue import VenueManagementService, get_venue_service

router = APIRouter(prefix="/pricing-profiles", tags=["pricing-profiles"])

@router.get("", response_model=list[PricingProfileResponse])
async def list_profiles(
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueManagementService, Depends(get_venue_service)],
) -> list[PricingProfileResponse]:
    """List all pricing profiles for the current merchant."""
    profiles = await venue_service.get_pricing_profiles(current_user.id)
    return profiles

@router.post("", response_model=PricingProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: PricingProfileCreate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueManagementService, Depends(get_venue_service)],
    session: DBSession,
) -> PricingProfileResponse:
    """Create a new pricing profile."""
    profile = await venue_service.create_pricing_profile(
        merchant_id=current_user.id,
        name=profile_data.name,
        description=profile_data.description,
        slots=[s.model_dump() for s in profile_data.slots],
    )
    await session.commit()
    return profile

@router.put("/{profile_id}", response_model=PricingProfileResponse)
async def update_profile(
    profile_id: str,
    profile_data: PricingProfileUpdate,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueManagementService, Depends(get_venue_service)],
    session: DBSession,
) -> PricingProfileResponse:
    """Update a pricing profile."""
    updates = profile_data.model_dump(exclude_unset=True)
    profile = await venue_service.update_pricing_profile(
        profile_id=uuid.UUID(profile_id),
        merchant_id=current_user.id,
        **updates,
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await session.commit()
    return profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueManagementService, Depends(get_venue_service)],
    session: DBSession,
) -> None:
    """Delete a pricing profile."""
    success = await venue_service.delete_pricing_profile(
        profile_id=uuid.UUID(profile_id),
        merchant_id=current_user.id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    await session.commit()

@router.post("/apply/{profile_id}/to-venue/{venue_id}")
async def apply_profile(
    profile_id: str,
    venue_id: str,
    current_user: Annotated[User, Depends(get_current_merchant)],
    venue_service: Annotated[VenueManagementService, Depends(get_venue_service)],
    session: DBSession,
) -> dict[str, str]:
    """Apply a pricing profile to a venue."""
    try:
        success = await venue_service.apply_pricing_profile(
            venue_id=uuid.UUID(venue_id),
            profile_id=uuid.UUID(profile_id),
            merchant_id=current_user.id,
        )
        if not success:
            raise HTTPException(status_code=404, detail="Profile or Venue not found")
        await session.commit()
        return {"message": "Profile applied successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
