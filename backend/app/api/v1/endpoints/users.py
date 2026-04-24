"""
User profile API endpoints.

Handles user profile retrieval and updates.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from app.api.deps import get_current_user, require_role, DBSession
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserProfileResponse, UpdatePushTokenRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserProfileResponse:
    """
    Get current user's full profile.

    Requires authentication.
    """
    return UserProfileResponse.model_validate(current_user)


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
) -> UserProfileResponse:
    """
    Get another user's public profile.

    Requires authentication. Does not expose sensitive data.
    """
    from uuid import UUID

    result = await session.execute(
        select(User).where(
            User.id == UUID(user_id),
            User.deleted_at.is_(None),
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserProfileResponse.model_validate(user)


@router.get("/merchants", response_model=list[UserResponse])
async def list_merchants(
    session: DBSession,
    skip: int = 0,
    limit: int = 20,
) -> list[UserResponse]:
    """
    List all merchant users.

    Useful for finding venue owners.
    """
    from sqlalchemy import func

    result = await session.execute(
        select(User)
        .where(
            User.role == UserRole.MERCHANT,
            User.is_active.is_(True),
            User.is_verified.is_(True),
            User.deleted_at.is_(None),
        )
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )

    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/me/push-token", status_code=status.HTTP_200_OK)
async def update_push_token(
    request: UpdatePushTokenRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
) -> dict[str, str]:
    """
    Update the Expo push token for the current user.
    """
    current_user.expo_push_token = request.token
    await session.commit()
    return {"message": "Push token updated successfully"}
