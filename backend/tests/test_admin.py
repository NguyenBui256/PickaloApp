"""
Tests for admin API endpoints.

Tests admin dashboard, user management, venue verification,
booking oversight, and content moderation.
"""

import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.booking import Booking, BookingStatus
from app.models.post import Post, PostType, PostStatus
from app.models.admin import AdminAction, ActionType


async def create_test_admin(session: AsyncSession) -> User:
    """Create a test admin user."""
    from app.core.security import hash_password

    admin = User(
        phone="+840000000001",
        password_hash=hash_password("Admin123!"),
        full_name="Test Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)
    return admin


async def create_test_user(session: AsyncSession, **kwargs) -> User:
    """Create a test regular user."""
    from app.core.security import hash_password

    user = User(
        phone=kwargs.get("phone", "+84998877665"),
        password_hash=hash_password("User123!"),
        full_name=kwargs.get("full_name", "Test User"),
        role=kwargs.get("role", UserRole.USER),
        is_active=kwargs.get("is_active", True),
        is_verified=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def create_test_merchant(session: AsyncSession) -> User:
    """Create a test merchant."""
    return await create_test_user(
        session,
        phone="+84998877666",
        full_name="Test Merchant",
        role=UserRole.MERCHANT,
    )


async def create_test_venue(session: AsyncSession, merchant: User) -> Venue:
    """Create a test venue."""
    from sqlalchemy import text

    venue = Venue(
        merchant_id=merchant.id,
        name="Test Sports Complex",
        address="123 Test Street, Hanoi",
        latitude=21.0285,
        longitude=105.8542,
        description="A great place to play sports",
        is_verified=False,
        is_active=True,
    )
    session.add(venue)
    await session.commit()
    await session.refresh(venue)
    return venue


async def get_auth_headers(client: AsyncClient, phone: str, password: str) -> dict:
    """Get authentication headers for a user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"phone": phone, "password": password},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_get_dashboard_metrics_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test getting dashboard metrics as admin."""
    # Create admin user
    admin = await create_test_admin(test_session)

    # Create some test data
    await create_test_user(test_session)
    await create_test_merchant(test_session)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Get dashboard metrics
    response = await client.get("/api/v1/admin/dashboard", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_merchants" in data
    assert "total_venues" in data
    assert "total_bookings" in data
    assert data["total_users"] >= 2


async def test_get_dashboard_metrics_as_user_forbidden(
    client: AsyncClient, test_session: AsyncSession
):
    """Test that regular users cannot access dashboard."""
    # Create regular user
    user = await create_test_user(test_session)

    # Get auth headers
    headers = await get_auth_headers(client, user.phone, "User123!")

    # Try to access dashboard
    response = await client.get("/api/v1/admin/dashboard", headers=headers)

    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


async def test_list_users_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test listing users as admin."""
    # Create admin and test users
    admin = await create_test_admin(test_session)
    await create_test_user(test_session, phone="+84998877661", full_name="Alice")
    await create_test_user(test_session, phone="+84998877662", full_name="Bob")

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # List users
    response = await client.get("/api/v1/admin/users", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "total" in data
    assert len(data["users"]) >= 3


async def test_ban_user_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test banning a user as admin."""
    # Create admin and test user
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Ban user
    response = await client.patch(
        f"/api/v1/admin/users/{user.id}/ban",
        headers=headers,
        json={"reason": "Violation of community guidelines"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False

    # Check audit log
    await test_session.refresh(admin)
    result = await test_session.execute(
        select(AdminAction).where(
            AdminAction.admin_id == admin.id,
            AdminAction.action_type == ActionType.BAN_USER,
        )
    )
    action = result.scalar_one_or_none()
    assert action is not None
    assert action.target_id == user.id


async def test_unban_user_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test unbanning a user as admin."""
    # Create admin and inactive user
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session, is_active=False)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Unban user
    response = await client.patch(
        f"/api/v1/admin/users/{user.id}/unban",
        headers=headers,
        json={"reason": "Account reinstated after review"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is True


async def test_update_user_role_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test changing user role as admin."""
    # Create admin and regular user
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Update user role to merchant
    response = await client.patch(
        f"/api/v1/admin/users/{user.id}/role",
        headers=headers,
        json={
            "role": "MERCHANT",
            "reason": "User requested merchant account",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "MERCHANT"


async def test_verify_venue_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test verifying a venue as admin."""
    # Create admin, merchant, and venue
    admin = await create_test_admin(test_session)
    merchant = await create_test_merchant(test_session)
    venue = await create_test_venue(test_session, merchant)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Verify venue
    response = await client.patch(
        f"/api/v1/admin/venues/{venue.id}/verify",
        headers=headers,
        json={
            "verified": True,
            "reason": "Venue verified after inspection",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True

    # Check audit log
    result = await test_session.execute(
        select(AdminAction).where(
            AdminAction.action_type == ActionType.VERIFY_VENUE,
            AdminAction.target_id == venue.id,
        )
    )
    action = result.scalar_one_or_none()
    assert action is not None


async def test_list_venues_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test listing venues as admin."""
    # Create admin, merchant, and venues
    admin = await create_test_admin(test_session)
    merchant = await create_test_merchant(test_session)
    await create_test_venue(test_session, merchant)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # List venues
    response = await client.get("/api/v1/admin/venues", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "venues" in data
    assert len(data["venues"]) >= 1


async def test_list_merchants_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test listing merchants as admin."""
    # Create admin and merchants
    admin = await create_test_admin(test_session)
    await create_test_merchant(test_session)
    await create_test_merchant(test_session)

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # List merchants
    response = await client.get("/api/v1/admin/merchants", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert len(data["users"]) >= 2


async def test_cancel_booking_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test cancelling a booking as admin."""
    # Create admin, user, merchant, venue, and booking
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session)
    merchant = await create_test_merchant(test_session)
    venue = await create_test_venue(test_session, merchant)

    from datetime import date, time, datetime

    booking = Booking(
        user_id=user.id,
        venue_id=venue.id,
        booking_date=date.today(),
        start_time=time(10, 0),
        end_time=time(11, 0),
        total_price=150000.0,
        status=BookingStatus.CONFIRMED,
    )
    test_session.add(booking)
    await test_session.commit()

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Cancel booking
    response = await client.patch(
        f"/api/v1/admin/bookings/{booking.id}/cancel",
        headers=headers,
        json={"reason": "Emergency maintenance at venue"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CANCELLED"


async def test_delete_post_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test deleting a post as admin."""
    # Create admin and post
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session)

    post = Post(
        author_id=user.id,
        content="This is inappropriate content",
        post_type=PostType.POST,
        status=PostStatus.PUBLISHED,
    )
    test_session.add(post)
    await test_session.commit()

    # Get auth headers
    headers = await get_auth_headers(client, admin.phone, "Admin123!")

    # Delete post
    response = await client.delete(f"/api/v1/admin/posts/{post.id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "deleted successfully" in data["message"]


async def test_get_audit_log_as_admin(
    client: AsyncClient, test_session: AsyncSession
):
    """Test getting audit log as admin."""
    # Create admin and perform some actions
    admin = await create_test_admin(test_session)
    user = await create_test_user(test_session)

    # Ban user to create audit entry
    headers = await get_auth_headers(client, admin.phone, "Admin123!")
    await client.patch(
        f"/api/v1/admin/users/{user.id}/ban",
        headers=headers,
        json={"reason": "Test ban"},
    )

    # Get audit log
    response = await client.get("/api/v1/admin/audit-log", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert "actions" in data
    assert len(data["actions"]) >= 1
    assert data["actions"][0]["action_type"] == "BAN_USER"
