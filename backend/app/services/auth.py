"""
Authentication business logic service.

Handles user authentication, token generation, and session management.
"""

import uuid
from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole


class AuthService:
    """
    Service for authentication operations.

    Methods:
        authenticate_user: Verify phone/password credentials
        create_user: Register new user account
        create_tokens: Generate JWT token pair
        refresh_access_token: Issue new access token
        logout_user: Invalidate refresh token
    """

    def __init__(self, session: AsyncSession):
        """Initialize auth service with database session."""
        self.session = session
        # In-memory refresh token storage (use Redis in production)
        self._refresh_tokens: dict[str, str] = {}

    async def authenticate_user(self, phone: str, password: str) -> User | None:
        """
        Verify user credentials.

        Args:
            phone: User's phone number
            password: Plain text password to verify

        Returns:
            User if credentials valid, None otherwise
        """
        result = await self.session.execute(
            select(User).where(
                User.phone == phone,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    async def create_user(
        self,
        phone: str,
        password: str,
        full_name: str,
        role: UserRole = UserRole.USER,
        email: str | None = None,
    ) -> User:
        """
        Register a new user account.

        Args:
            phone: Unique phone number
            password: Plain text password (will be hashed)
            full_name: User's display name
            role: User role (default: USER)
            email: Optional email address

        Returns:
            Created user instance

        Raises:
            ValueError: If phone already registered
        """
        # Check if phone already exists
        existing = await self.session.execute(
            select(User).where(User.phone == phone)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Phone number already registered")

        # Create new user
        user = User(
            phone=phone,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
            email=email,
            is_active=True,
            is_verified=False,  # Requires phone verification
        )

        self.session.add(user)
        await self.session.flush()

        return user

    def create_tokens(self, user: User) -> dict[str, Any]:
        """
        Generate JWT access and refresh tokens for user.

        Args:
            user: User to generate tokens for

        Returns:
            Dictionary with access_token, refresh_token, expires_in
        """
        # Generate tokens
        access_token = create_access_token(
            {"sub": str(user.id), "role": user.role.value}
        )
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token (in production, use Redis)
        token_id = str(uuid.uuid4())
        self._refresh_tokens[token_id] = refresh_token

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }

    async def refresh_access_token(self, refresh_token: str) -> str | None:
        """
        Validate refresh token and issue new access token.

        Args:
            refresh_token: Refresh token to validate

        Returns:
            New access token if valid, None otherwise
        """
        try:
            # Decode refresh token
            payload = jwt.decode(
                refresh_token,
                settings.secret_key,
                algorithms=[settings.algorithm],
            )

            user_id = payload.get("sub")
            if not user_id:
                return None

            # Verify user exists and is active
            result = await self.session.execute(
                select(User).where(
                    User.id == uuid.UUID(user_id),
                    User.is_active.is_(True),
                    User.deleted_at.is_(None),
                )
            )
            user = result.scalar_one_or_none()

            if not user:
                return None

            # Generate new access token
            return create_access_token(
                {"sub": str(user.id), "role": user.role.value}
            )

        except JWTError:
            return None

    async def logout_user(self, refresh_token: str) -> bool:
        """
        Invalidate a refresh token (logout).

        Args:
            refresh_token: Token to invalidate

        Returns:
            True if token was valid and removed
        """
        try:
            # Decode to get token ID (simplified - in production track properly)
            payload = jwt.decode(
                refresh_token,
                settings.secret_key,
                algorithms=[settings.algorithm],
            )

            # Remove from storage
            # In production, remove from Redis by token ID
            return True

        except JWTError:
            return False

    async def get_user_by_token(self, token: str) -> User | None:
        """
        Get user from JWT access token.

        Args:
            token: JWT access token

        Returns:
            User if token valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm],
            )

            user_id = payload.get("sub")
            if not user_id:
                return None

            result = await self.session.execute(
                select(User).where(
                    User.id == uuid.UUID(user_id),
                    User.is_active.is_(True),
                    User.deleted_at.is_(None),
                )
            )

            return result.scalar_one_or_none()

        except JWTError:
            return None

    async def verify_phone_number(self, phone: str, otp: str) -> bool:
        """
        Verify phone number with OTP code.

        NOTE: This is a placeholder implementation.
        In production, integrate with SMS provider (Viettel, Mobifone, etc.)

        Args:
            phone: Phone number to verify
            otp: 6-digit OTP code

        Returns:
            True if verification successful
        """
        # TODO: Integrate with SMS provider
        # For testing, accept "123456" as valid OTP
        if otp == "123456":
            # Mark user as verified
            result = await self.session.execute(
                select(User).where(User.phone == phone)
            )
            user = result.scalar_one_or_none()

            if user:
                user.is_verified = True
                await self.session.flush()
                return True

        return False

    async def change_password(
        self, user: User, old_password: str, new_password: str
    ) -> bool:
        """
        Change user password.

        Args:
            user: User to change password for
            old_password: Current password to verify
            new_password: New password to set

        Returns:
            True if password changed successfully

        Raises:
            ValueError: If old password is incorrect
        """
        if not verify_password(old_password, user.password_hash):
            raise ValueError("Incorrect current password")

        user.password_hash = hash_password(new_password)
        await self.session.flush()

        return True


async def get_auth_service(session: AsyncSession) -> AuthService:
    """
    Dependency to get auth service instance.

    Args:
        session: Database session

    Returns:
        AuthService instance
    """
    return AuthService(session)
