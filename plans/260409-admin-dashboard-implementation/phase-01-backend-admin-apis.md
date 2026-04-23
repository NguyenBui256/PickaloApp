# Phase 1: Backend - Admin Dashboard APIs

**Status:** Pending
**Priority:** P1
**Estimated Effort:** 8 hours

## Overview

Implement the backend API endpoints for the admin dashboard system. This includes platform metrics, user management, merchant verification, booking oversight, content moderation, and audit logging.

## Related Files

### Files to Create
- `backend/app/schemas/admin.py` - Admin request/response schemas
- `backend/app/services/admin.py` - Admin business logic service
- `backend/app/api/v1/endpoints/admin.py` - Admin API routes
- `backend/tests/test_admin.py` - Admin endpoint tests

### Files to Modify
- `backend/app/api/v1/api.py` - Register admin router

---

## Implementation Steps

### Step 1: Create Admin Schemas

**File:** `backend/app/schemas/admin.py`

```python
# Schema requirements:
from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field

from app.models.user import UserRole
from app.models.booking import BookingStatus
from app.models.admin import ActionType, TargetType

# Dashboard Metrics
class DashboardMetrics(BaseModel):
    users: UserMetrics
    venues: VenueMetrics
    bookings: BookingMetrics
    content: ContentMetrics

# User Management
class UserListFilters(BaseModel):
    page: int = 1
    limit: int = 20
    role: UserRole | None = None
    is_active: bool | None = None
    is_verified: bool | None = None
    search: str | None = None

class UserBanRequest(BaseModel):
    reason: Annotated[str, Field(max_length=500)]
    duration_days: int | None = None  # None = permanent

class UserRoleUpdate(BaseModel):
    role: UserRole
    reason: Annotated[str, Field(max_length=500)]

# Merchant Management
class MerchantVerificationRequest(BaseModel):
    verified: bool
    reason: Annotated[str, Field(max_length=500)]

# Booking Management
class BookingListFilters(BaseModel):
    page: int = 1
    limit: int = 20
    status: BookingStatus | None = None
    date_from: date | None = None
    date_to: date | None = None
    venue_id: str | None = None
    user_id: str | None = None

class AdminBookingCancel(BaseModel):
    reason: Annotated[str, Field(max_length=500)]

# Content Moderation
class PostListFilters(BaseModel):
    page: int = 1
    limit: int = 20
    status: str | None = None
    sport_type: str | None = None
    reported: bool = False

class ContentDelete(BaseModel):
    reason: Annotated[str, Field(max_length=500)]

# Audit Log
class AuditLogFilters(BaseModel):
    page: int = 1
    limit: int = 20
    action_type: ActionType | None = None
    target_type: TargetType | None = None
    admin_id: str | None = None
    date_from: date | None = None
    date_to: date | None = None
```

### Step 2: Create Admin Service

**File:** `backend/app/services/admin.py`

```python
# Service requirements:
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, date, timedelta

from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.booking import Booking
from app.models.post import Post, Comment
from app.models.admin import AdminAction, ActionType, TargetType

class AdminService:
    """Business logic for admin operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    # Dashboard Metrics
    async def get_dashboard_metrics(self) -> dict:
        """Calculate platform-wide metrics."""
        # User metrics
        total_users = await self._count(User)
        active_users = await self._count(User, User.is_active.is_(True))
        new_users_week = await self._count_new_users(days=7)

        # Venue metrics
        total_venues = await self._count(Venue)
        verified_venues = await self._count(Venue, Venue.is_verified.is_(True))

        # Booking metrics
        total_bookings = await self._count(Booking)
        pending_bookings = await self._count(Booking, Booking.status == "PENDING")

        # Revenue calculation
        total_revenue = await self._calculate_revenue()

        # Content metrics
        total_posts = await self._count(Post)
        total_comments = await self._count(Comment)

        return {
            "users": {...},
            "venues": {...},
            "bookings": {...},
            "content": {...}
        }

    # User Management
    async def list_users(self, filters: UserListFilters) -> dict:
        """List users with pagination and filters."""
        query = select(User).where(User.deleted_at.is_(None))

        # Apply filters
        if filters.role:
            query = query.where(User.role == filters.role)
        if filters.is_active is not None:
            query = query.where(User.is_active.is_(filters.is_active))
        if filters.is_verified is not None:
            query = query.where(User.is_verified.is_(filters.is_verified))
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    User.phone.ilike(search_term),
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                )
            )

        # Pagination
        query = query.order_by(User.created_at.desc())
        result = await self.session.execute(query)
        users = result.scalars().all()

        return {
            "items": [self._user_to_dict(u) for u in users],
            "total": len(users),
            "page": filters.page,
            "limit": filters.limit
        }

    async def ban_user(
        self,
        user_id: str,
        admin: User,
        reason: str,
        duration_days: int | None = None
    ) -> User:
        """Ban a user."""
        user = await self._get_user(user_id)
        user.is_active = False

        # Create audit log
        await self._log_action(
            admin=admin,
            action_type=ActionType.BAN_USER,
            target_type=TargetType.USER,
            target_id=user.id,
            reason=reason
        )

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def unban_user(self, user_id: str, admin: User, reason: str) -> User:
        """Unban a user."""
        user = await self._get_user(user_id)
        user.is_active = True

        await self._log_action(
            admin=admin,
            action_type=ActionType.UNBAN_USER,
            target_type=TargetType.USER,
            target_id=user.id,
            reason=reason
        )

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_user_role(
        self,
        user_id: str,
        new_role: UserRole,
        admin: User,
        reason: str
    ) -> User:
        """Update user role."""
        user = await self._get_user(user_id)
        old_role = user.role
        user.role = new_role

        await self._log_action(
            admin=admin,
            action_type=ActionType.UPDATE_USER_ROLE,
            target_type=TargetType.USER,
            target_id=user.id,
            reason=f"Changed role from {old_role} to {new_role}: {reason}"
        )

        await self.session.commit()
        await self.session.refresh(user)
        return user

    # Merchant Management
    async def list_merchants(self, filters: UserListFilters) -> dict:
        """List merchants with venue counts."""
        # Similar to list_users but includes venue counts
        pass

    async def verify_venue(
        self,
        venue_id: str,
        admin: User,
        verified: bool,
        reason: str
    ) -> Venue:
        """Verify or unverify a venue."""
        venue = await self._get_venue(venue_id)
        venue.is_verified = verified

        action = ActionType.VERIFY_VENUE if verified else ActionType.UNVERIFY_VENUE
        await self._log_action(
            admin=admin,
            action_type=action,
            target_type=TargetType.VENUE,
            target_id=venue.id,
            reason=reason
        )

        await self.session.commit()
        await self.session.refresh(venue)
        return venue

    # Booking Management
    async def list_all_bookings(self, filters: BookingListFilters) -> dict:
        """List all bookings (admin sees everything)."""
        pass

    async def cancel_booking(
        self,
        booking_id: str,
        admin: User,
        reason: str
    ) -> Booking:
        """Cancel any booking as admin."""
        booking = await self._get_booking(booking_id)
        booking.cancel(cancelled_by="ADMIN")

        await self._log_action(
            admin=admin,
            action_type=ActionType.CANCEL_BOOKING,
            target_type=TargetType.BOOKING,
            target_id=booking.id,
            reason=reason
        )

        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    # Content Moderation
    async def list_posts(self, filters: PostListFilters) -> dict:
        """List posts with moderation filters."""
        pass

    async def delete_post(
        self,
        post_id: str,
        admin: User,
        reason: str
    ) -> None:
        """Delete a post."""
        post = await self._get_post(post_id)
        post.status = "HIDDEN"

        await self._log_action(
            admin=admin,
            action_type=ActionType.DELETE_POST,
            target_type=TargetType.POST,
            target_id=post.id,
            reason=reason
        )

        await self.session.commit()

    async def delete_comment(
        self,
        comment_id: str,
        admin: User,
        reason: str
    ) -> None:
        """Delete a comment."""
        comment = await self._get_comment(comment_id)

        await self._log_action(
            admin=admin,
            action_type=ActionType.DELETE_POST,
            target_type=TargetType.COMMENT,
            target_id=comment.id,
            reason=reason
        )

        await self.session.delete(comment)
        await self.session.commit()

    # Audit Log
    async def get_audit_log(self, filters: AuditLogFilters) -> dict:
        """Get admin action history."""
        pass

    # Helper methods
    async def _log_action(
        self,
        admin: User,
        action_type: ActionType,
        target_type: TargetType,
        target_id: str,
        reason: str
    ) -> AdminAction:
        """Create an audit log entry."""
        action = AdminAction(
            admin_id=admin.id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            reason=reason
        )
        self.session.add(action)
        return action

    async def _get_user(self, user_id: str) -> User:
        """Get user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id, User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        return user

    # Similar helpers for venue, booking, post, comment
```

### Step 3: Create Admin Endpoints

**File:** `backend/app/api/v1/endpoints/admin.py`

```python
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin, DBSession
from app.models.user import User, UserRole
from app.models.admin import ActionType, TargetType
from app.schemas.admin import (
    DashboardMetrics,
    UserListFilters,
    UserBanRequest,
    UserRoleUpdate,
    MerchantVerificationRequest,
    BookingListFilters,
    AdminBookingCancel,
    PostListFilters,
    ContentDelete,
    AuditLogFilters,
)
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])

# All endpoints require admin role
@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard(
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
) -> DashboardMetrics:
    """Get platform-wide dashboard metrics."""
    service = AdminService(session)
    metrics = await service.get_dashboard_metrics()
    return DashboardMetrics(**metrics)

# User Management
@router.get("/users")
async def list_users(
    filters: Annotated[UserListFilters, Query()],
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """List all users with filters."""
    service = AdminService(session)
    return await service.list_users(filters)

@router.patch("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    request: UserBanRequest,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Ban a user."""
    service = AdminService(session)
    user = await service.ban_user(
        user_id=user_id,
        admin=current_admin,
        reason=request.reason,
        duration_days=request.duration_days
    )
    return {"message": "User banned successfully", "user_id": str(user.id)}

@router.patch("/users/{user_id}/unban")
async def unban_user(
    user_id: str,
    reason: str,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Unban a user."""
    service = AdminService(session)
    user = await service.unban_user(user_id, current_admin, reason)
    return {"message": "User unbanned successfully"}

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    request: UserRoleUpdate,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Update user role."""
    service = AdminService(session)
    user = await service.update_user_role(
        user_id=user_id,
        new_role=request.role,
        admin=current_admin,
        reason=request.reason
    )
    return {"message": "User role updated", "new_role": user.role}

# Merchant Management
@router.get("/merchants")
async def list_merchants(
    filters: Annotated[UserListFilters, Query()],
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """List merchants with verification status."""
    service = AdminService(session)
    filters.role = UserRole.MERCHANT
    return await service.list_merchants(filters)

@router.patch("/venues/{venue_id}/verify")
async def verify_venue(
    venue_id: str,
    request: MerchantVerificationRequest,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Verify or unverify a venue."""
    service = AdminService(session)
    venue = await service.verify_venue(
        venue_id=venue_id,
        admin=current_admin,
        verified=request.verified,
        reason=request.reason
    )
    return {
        "message": f"Venue {'verified' if request.verified else 'unverified'}",
        "venue_id": str(venue.id),
        "is_verified": venue.is_verified
    }

# Booking Management
@router.get("/bookings")
async def list_all_bookings(
    filters: Annotated[BookingListFilters, Query()],
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """List all platform bookings."""
    service = AdminService(session)
    return await service.list_all_bookings(filters)

@router.patch("/bookings/{booking_id}/cancel")
async def cancel_booking_admin(
    booking_id: str,
    request: AdminBookingCancel,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Cancel any booking as admin."""
    service = AdminService(session)
    booking = await service.cancel_booking(
        booking_id=booking_id,
        admin=current_admin,
        reason=request.reason
    )
    return {"message": "Booking cancelled", "booking_id": str(booking.id)}

# Content Moderation
@router.get("/posts")
async def list_posts_for_moderation(
    filters: Annotated[PostListFilters, Query()],
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """List posts for moderation."""
    service = AdminService(session)
    return await service.list_posts(filters)

@router.delete("/posts/{post_id}")
async def delete_post_admin(
    post_id: str,
    request: ContentDelete,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Delete a post."""
    service = AdminService(session)
    await service.delete_post(post_id, current_admin, request.reason)
    return {"message": "Post deleted"}

@router.delete("/comments/{comment_id}")
async def delete_comment_admin(
    comment_id: str,
    request: ContentDelete,
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Delete a comment."""
    service = AdminService(session)
    await service.delete_comment(comment_id, current_admin, request.reason)
    return {"message": "Comment deleted"}

# Audit Log
@router.get("/audit-log")
async def get_audit_log(
    filters: Annotated[AuditLogFilters, Query()],
    current_admin: Annotated[User, Depends(get_admin)],
    session: DBSession,
):
    """Get admin action history."""
    service = AdminService(session)
    return await service.get_audit_log(filters)
```

### Step 4: Register Admin Router

**File:** `backend/app/api/v1/api.py`

Add to imports:
```python
from app.api.v1.endpoints import admin
```

Add to router:
```python
api_router.include_router(admin.router)
```

---

## Success Criteria

- [ ] All admin schemas created in `schemas/admin.py`
- [ ] AdminService with all methods implemented
- [ ] All admin endpoints functional
- [ ] Admin router registered in API
- [ ] All endpoints require admin role
- [ ] Audit log entries created for all actions
- [ ] Tests passing (80%+ coverage)

---

## Security Checklist

- [ ] All endpoints use `get_admin()` dependency
- [ ] Audit log created for every admin action
- [ ] No sensitive data in responses (passwords, tokens)
- [ ] Rate limiting on bulk operations
- [ ] Input validation on all parameters
- [ ] SQL injection prevention (parameterized queries)

---

## Testing

Write tests in `backend/tests/test_admin.py`:

1. Dashboard metrics aggregation
2. User listing with filters
3. User ban/unban operations
4. User role changes
5. Merchant listing
6. Venue verification
7. Booking listing and cancellation
8. Post/comment deletion
9. Audit log retrieval
10. Access control (non-admin blocked)

