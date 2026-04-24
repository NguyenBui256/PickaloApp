"""
Common dependencies for API endpoints.

Provides reusable dependency injection functions for authentication,
authorization, database access, and resource ownership verification.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_token
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.services.storage import StorageService

# HTTP Bearer token scheme for authentication
security = HTTPBearer(auto_error=False)

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_from_token(token: str, session: AsyncSession) -> User:
    """Helper for WebSocket authentication."""
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await session.execute(
        select(User).where(User.id == UUID(user_id), User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
        
    return user
async def get_storage_service() -> StorageService:
    """Get storage service instance."""
    return StorageService()


# Type alias for storage service dependency
StorageServiceDep = Annotated[StorageService, Depends(get_storage_service)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: DBSession,
) -> User:
    """
    Dependency to get current authenticated User from JWT token.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await get_current_user_from_token(credentials.credentials, session)

    # Get user from database
    result = await session.execute(
        select(User).where(
            User.id == UUID(user_id),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Dependency to get current active user (verified and not deleted).

    Args:
        current_user: User from get_current_user dependency

    Returns:
        Active User instance

    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.is_verified and settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Phone number not verified. Please verify your account.",
        )

    return current_user


def require_role(*allowed_roles: UserRole) -> type:
    """
    Factory that creates a dependency for role-based access control.

    Args:
        *allowed_roles: Roles that are allowed to access the endpoint

    Returns:
        Dependency function that checks user role

    Example:
        @app.get("/admin/dashboard")
        async def admin_dashboard(
            user: Annotated[User, Depends(require_role(UserRole.ADMIN))]
        ):
            return {"message": "Welcome admin"}
    """

    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        """
        Check if current user has required role.

        Args:
            current_user: User from get_current_user dependency

        Returns:
            User if role is allowed

        Raises:
            HTTPException: If user role is not allowed
        """
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(r.value for r in allowed_roles)}",
            )

        return current_user

    return role_checker


async def get_current_merchant(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Dependency to verify user is a merchant.

    Use this for endpoints that require merchant access.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        Merchant User instance

    Raises:
        HTTPException: If user is not a merchant
    """
    if current_user.role != UserRole.MERCHANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Merchant role required.",
        )

    return current_user


async def get_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Dependency to verify user is an admin.

    Use this for admin-only endpoints.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        Admin User instance

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required.",
        )

    return current_user


async def verify_venue_ownership(
    venue_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
) -> Venue:
    """
    Dependency to verify user owns the venue.

    Use this for endpoints that modify venue data.

    Args:
        venue_id: Venue UUID to verify ownership
        current_user: User from get_current_user dependency
        session: Database session

    Returns:
        Venue instance

    Raises:
        HTTPException: If venue not found or user doesn't own it
    """
    result = await session.execute(
        select(Venue).where(
            Venue.id == venue_id,
            Venue.deleted_at.is_(None),
        )
    )
    venue = result.scalar_one_or_none()

    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found",
        )

    # Check ownership (admin can access any venue)
    if venue.merchant_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this venue",
        )

    return venue


# Legacy: get_current_user_id for backward compatibility
async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    """
    Dependency to get current user ID from JWT token (legacy, use get_current_user).

    Args:
        credentials: HTTP Bearer credentials from Authorization header

    Returns:
        User ID if token is valid, None otherwise

    Raises:
        HTTPException: If token is invalid (optional, based on endpoint requirements)
    """
    if credentials is None:
        return None

    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def require_auth(
    current_user: Annotated[str | None, Depends(get_current_user_id)]
) -> str:
    """
    Dependency that requires authentication (legacy, use get_current_user).

    Use this for endpoints that require a logged-in user.

    Args:
        current_user: User ID from get_current_user_id dependency

    Returns:
        User ID string

    Raises:
        HTTPException: If user is not authenticated
    """
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return current_user
