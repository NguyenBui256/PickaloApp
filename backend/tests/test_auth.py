"""
Authentication endpoint tests.

Tests for registration, login, token refresh, and protected endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+84901234567",
            "password": "SecurePass123",
            "full_name": "Test User",
            "role": "USER",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["phone"] == "+84901234567"
    assert data["user"]["role"] == "USER"


@pytest.mark.asyncio
async def test_register_duplicate_phone(client: AsyncClient) -> None:
    """Test registration with duplicate phone number."""
    # First registration
    await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+84901234568",
            "password": "SecurePass123",
            "full_name": "Test User",
        },
    )

    # Duplicate registration
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+84901234568",
            "password": "SecurePass123",
            "full_name": "Another User",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient) -> None:
    """Test registration with weak password."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+84901234569",
            "password": "weak",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test successful login."""
    # Create test user first
    user = User(
        phone="+84901234570",
        password_hash=hash_password("SecurePass123"),
        full_name="Login Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234570",
            "password": "SecurePass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["phone"] == "+84901234570"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient) -> None:
    """Test login with invalid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234571",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_protected(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test accessing protected /me endpoint."""
    # Create and login user
    user = User(
        phone="+84901234572",
        password_hash=hash_password("SecurePass123"),
        full_name="Protected Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234572",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Access protected endpoint
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+84901234572"


@pytest.mark.asyncio
async def test_get_me_without_token(client: AsyncClient) -> None:
    """Test accessing protected endpoint without token."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test token refresh."""
    # Create user
    user = User(
        phone="+84901234573",
        password_hash=hash_password("SecurePass123"),
        full_name="Refresh Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get tokens
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234573",
            "password": "SecurePass123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh access token
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test logout functionality."""
    # Create user
    user = User(
        phone="+84901234574",
        password_hash=hash_password("SecurePass123"),
        full_name="Logout Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get tokens
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234574",
            "password": "SecurePass123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]

    # Logout
    response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_verify_phone_placeholder(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test phone verification (placeholder OTP: 123456)."""
    # Create unverified user
    user = User(
        phone="+84901234575",
        password_hash=hash_password("SecurePass123"),
        full_name="Verify Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=False,
    )
    db_session.add(user)
    await db_session.commit()

    # Verify phone with test OTP
    response = await client.post(
        "/api/v1/auth/verify-phone",
        json={
            "phone": "+84901234575",
            "otp": "123456",  # Test OTP
        },
    )
    assert response.status_code == 200

    # Check user is now verified
    await db_session.refresh(user)
    assert user.is_verified is True


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test successful password change."""
    # Create user
    user = User(
        phone="+84901234576",
        password_hash=hash_password("OldPass123"),
        full_name="Password Change Test",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234576",
            "password": "OldPass123",
        },
    )
    token = login_response.json()["access_token"]

    # Change password
    response = await client.post(
        "/api/v1/auth/me/change-password",
        params={
            "old_password": "OldPass123",
            "new_password": "NewPass456",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_old(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test password change with incorrect old password."""
    # Create user
    user = User(
        phone="+84901234577",
        password_hash=hash_password("CorrectPass123"),
        full_name="Wrong Password Test",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234577",
            "password": "CorrectPass123",
        },
    )
    token = login_response.json()["access_token"]

    # Try to change with wrong old password
    response = await client.post(
        "/api/v1/auth/me/change-password",
        params={
            "old_password": "WrongPass123",
            "new_password": "NewPass456",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test updating user profile."""
    # Create user
    user = User(
        phone="+84901234578",
        password_hash=hash_password("SecurePass123"),
        full_name="Original Name",
        role=UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234578",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Update profile
    response = await client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_merchant_role_access(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test role-based access control."""
    # Create merchant user
    merchant = User(
        phone="+84901234579",
        password_hash=hash_password("SecurePass123"),
        full_name="Merchant User",
        role=UserRole.MERCHANT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(merchant)
    await db_session.commit()

    # Login as merchant
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "phone": "+84901234579",
            "password": "SecurePass123",
        },
    )
    token = login_response.json()["access_token"]

    # Access merchant endpoint (if exists)
    # This test will be expanded when merchant endpoints are added
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "MERCHANT"
