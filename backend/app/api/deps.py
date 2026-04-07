"""
Common dependencies for API endpoints.

Provides reusable dependency injection functions for authentication and database access.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

# HTTP Bearer token scheme for authentication
security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    """
    Dependency to get current user ID from JWT token.

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
    Dependency that requires authentication.

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


# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    session: DBSession,
) -> User:
    """
    Dependency to get current authenticated User from JWT token.

    Args:
        credentials: HTTP Bearer credentials from Authorization header
        session: Database session

    Returns:
        Authenticated User instance

    Raises:
        HTTPException: If token is missing, invalid, or user not found
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
    if not current_user.is_verified:
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
