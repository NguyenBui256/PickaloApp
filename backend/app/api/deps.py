"""
Common dependencies for API endpoints.

Provides reusable dependency injection functions for authentication and database access.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.core.security import verify_token

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

# Re-export AsyncSession for type hints
from sqlalchemy.ext.asyncio import AsyncSession
