"""
Authentication API endpoints.

Handles user registration, login, token refresh, and logout.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_role, DBSession
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    AuthResponse,
    TokenResponse,
    VerifyPhoneRequest,
)
from app.schemas.user import UserResponse, UserUpdate
from app.services.auth import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    session: DBSession,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    """
    Register a new user account.

    - **phone**: Vietnamese phone number (+84xxxxxxxxx)
    - **password**: Min 8 characters, uppercase, lowercase, digit
    - **full_name**: User's display name
    - **role**: USER, MERCHANT, or ADMIN (default: USER)
    """
    try:
        # Create user
        user = await auth_service.create_user(
            phone=user_data.phone,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role,
            email=user_data.email,
        )

        # Generate tokens
        tokens = auth_service.create_tokens(user)

        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
            user=UserResponse.model_validate(user),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest,
    session: DBSession,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    """
    Login with phone and password.

    Returns JWT access and refresh tokens.
    """
    # Authenticate user
    user = await auth_service.authenticate_user(
        phone=credentials.phone,
        password=credentials.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate tokens
    tokens = auth_service.create_tokens(user)

    return AuthResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token from login/register
    """
    access_token = await auth_service.refresh_access_token(token_data.refresh_token)

    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=15 * 60,  # 15 minutes
    )


@router.post("/logout")
async def logout(
    token_data: RefreshTokenRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    """
    Logout and invalidate refresh token.

    - **refresh_token**: Refresh token to invalidate
    """
    success = await auth_service.logout_user(token_data.refresh_token)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return {"message": "Successfully logged out"}


@router.post("/verify-phone")
async def verify_phone(
    verification_data: VerifyPhoneRequest,
    session: DBSession,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    """
    Verify phone number with OTP code.

    NOTE: This is a placeholder implementation.
    For testing, use OTP code: 123456

    - **phone**: Phone number to verify
    - **otp**: 6-digit OTP code
    """
    success = await auth_service.verify_phone_number(
        phone=verification_data.phone,
        otp=verification_data.otp,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )

    return {"message": "Phone verified successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """
    Get current authenticated user's profile.

    Requires valid JWT access token.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
) -> UserResponse:
    """
    Update current authenticated user's profile.

    All fields are optional. Only provided fields will be updated.
    """
    # Update only provided fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    await session.commit()
    await session.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/me/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: DBSession,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    """
    Change current user's password.

    - **old_password**: Current password for verification
    - **new_password**: New password (min 8 chars, uppercase, lowercase, digit)
    """
    try:
        await auth_service.change_password(
            user=current_user,
            old_password=old_password,
            new_password=new_password,
        )

        await session.commit()

        return {"message": "Password changed successfully"}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
