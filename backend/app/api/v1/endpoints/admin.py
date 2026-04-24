"""
Admin API endpoints.

Administrative operations for user management, venue verification,
booking oversight, and content moderation.
All endpoints require admin role.
"""

from typing import Annotated
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin, DBSession
from app.models.user import User, UserRole
from app.models.admin import ActionType
from app.schemas.admin import (
    DashboardMetrics,
    UserListResponse,
    UserListItem,
    BanUserRequest,
    UnbanUserRequest,
    UpdateUserRoleRequest,
    CreateUserRequest,
    MessageResponse,
    VenueListResponse,
    VenueAdminListItem,
    VerifyVenueRequest,
    BookingListResponse,
    BookingAdminListItem,
    BookingAdminDetail,
    CancelBookingRequest,
    UpdateVenueStatusRequest,
    PostListResponse,
    PostAdminListItem,
    CommentListResponse,
    CommentAdminListItem,
    AuditLogResponse,
    AuditLogItem,
    ReportListResponse,
)
from app.services.admin import AdminService, get_admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


# Dashboard
@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> DashboardMetrics:
    """
    Get platform-wide metrics for admin dashboard.

    Requires admin role.
    """
    metrics = await admin_service.get_dashboard_metrics()
    return DashboardMetrics(**metrics)


# User Management
@router.get("/users", response_model=UserListResponse)
async def list_users(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> UserListResponse:
    """
    List users with pagination and filters.

    - **page**: Page number (1-indexed)
    - **limit**: Items per page (max 100)
    - **role**: Filter by user role (USER, MERCHANT, ADMIN)
    - **is_active**: Filter by active status
    - **search**: Search in phone, name, email

    Requires admin role.
    """
    users, total = await admin_service.list_users(
        page=page,
        limit=limit,
        role=role,
        is_active=is_active,
        search=search,
    )

    user_items = [UserListItem.model_validate(u) for u in users]

    return UserListResponse(
        users=user_items,
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/users", response_model=UserListItem)
async def create_user(
    request_data: CreateUserRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> UserListItem:
    """
    Create a new user account as an admin.

    Requires admin role.
    """
    try:
        user = await admin_service.create_user(
            user_data=request_data.model_dump(),
            admin=admin,
        )
        return UserListItem.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/users/{user_id}/ban", response_model=UserListItem)
async def ban_user(
    user_id: UUID,
    request_data: BanUserRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> UserListItem:
    """
    Ban a user account.

    - **user_id**: User to ban
    - **reason**: Reason for banning (min 10 characters)

    Requires admin role.
    """
    try:
        user = await admin_service.ban_user(
            user_id=user_id,
            admin=admin,
            reason=request_data.reason,
        )
        return UserListItem.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/users/{user_id}/unban", response_model=UserListItem)
async def unban_user(
    user_id: UUID,
    request_data: UnbanUserRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> UserListItem:
    """
    Unban a user account.

    - **user_id**: User to unban
    - **reason**: Reason for unbanning (min 10 characters)

    Requires admin role.
    """
    try:
        user = await admin_service.unban_user(
            user_id=user_id,
            admin=admin,
            reason=request_data.reason,
        )
        return UserListItem.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/users/{user_id}/role", response_model=UserListItem)
async def update_user_role(
    user_id: UUID,
    request_data: UpdateUserRoleRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> UserListItem:
    """
    Change user role.

    - **user_id**: User to update
    - **role**: New role (USER, MERCHANT, ADMIN)
    - **reason**: Reason for role change (min 10 characters)

    Requires admin role.
    """
    try:
        user = await admin_service.update_user_role(
            user_id=user_id,
            new_role=request_data.role,
            admin=admin,
            reason=request_data.reason,
        )
        return UserListItem.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Merchant & Venue Management
@router.get("/merchants", response_model=UserListResponse)
async def list_merchants(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
) -> UserListResponse:
    """
    List all merchant accounts.

    - **page**: Page number
    - **limit**: Items per page
    - **search**: Search in name, phone, email

    Requires admin role.
    """
    merchants, total = await admin_service.list_merchants(
        page=page,
        limit=limit,
        search=search,
    )

    merchant_items = [UserListItem.model_validate(m) for m in merchants]

    return UserListResponse(
        users=merchant_items,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/venues", response_model=VenueListResponse)
async def list_venues(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_verified: bool | None = None,
    search: str | None = None,
) -> VenueListResponse:
    """
    List venues with pagination and filters.

    - **page**: Page number
    - **limit**: Items per page
    - **is_verified**: Filter by verification status
    - **search**: Search in name, address

    Requires admin role.
    """
    venues, total = await admin_service.list_venues(
        page=page,
        limit=limit,
        is_verified=is_verified,
        search=search,
    )

    venue_items = [VenueAdminListItem.model_validate(v) for v in venues]

    return VenueListResponse(
        venues=venue_items,
        total=total,
        page=page,
        limit=limit,
    )


@router.patch("/venues/{venue_id}/verify", response_model=VenueAdminListItem)
async def verify_venue(
    venue_id: UUID,
    request_data: VerifyVenueRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> VenueAdminListItem:
    """
    Verify or unverify a venue.

    - **venue_id**: Venue to verify/unverify
    - **verified**: Verification status to set
    - **reason**: Reason for verification change (min 10 characters)

    Requires admin role.
    """
    try:
        venue = await admin_service.verify_venue(
            venue_id=venue_id,
            verified=request_data.verified,
            admin=admin,
            reason=request_data.reason,
        )
        return VenueAdminListItem.model_validate(venue)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/venues/{venue_id}/status", response_model=VenueAdminListItem)
async def update_venue_status(
    venue_id: UUID,
    request_data: UpdateVenueStatusRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> VenueAdminListItem:
    """
    Deactivate or reactivate a venue.

    Requires admin role.
    """
    try:
        venue = await admin_service.update_venue_status(
            venue_id=venue_id,
            is_active=request_data.is_active,
            admin=admin,
            reason=request_data.reason,
        )
        return VenueAdminListItem.model_validate(venue)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Booking Management
@router.get("/bookings", response_model=BookingListResponse)
async def list_bookings(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
) -> BookingListResponse:
    """
    List all bookings platform-wide.

    - **page**: Page number
    - **limit**: Items per page
    - **status**: Filter by booking status
    - **search**: Search in user name, venue name

    Requires admin role.
    """
    bookings, total = await admin_service.list_bookings(
        page=page,
        limit=limit,
        status=status,
        search=search,
    )

    booking_items = [BookingAdminListItem.model_validate(b) for b in bookings]

    return BookingListResponse(
        bookings=booking_items,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/bookings/{booking_id}", response_model=BookingAdminDetail)
async def get_booking_detail(
    booking_id: UUID,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> BookingAdminDetail:
    """
    Get detailed booking information with audit trail.

    Requires admin role.
    """
    try:
        booking = await admin_service.get_booking_detail(booking_id=booking_id)
        
        # Map additional fields for detail view
        detail = BookingAdminDetail.model_validate(booking)
        
        # Example: detail.payment_status = booking.payment.status if booking.payment else None
        # This part depends on the Booking model relationships which I'll assume are correct or will be added
        
        return detail
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch("/bookings/{booking_id}/cancel", response_model=BookingAdminListItem)
async def cancel_booking(
    booking_id: UUID,
    request_data: CancelBookingRequest,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> BookingAdminListItem:
    """
    Cancel a booking (admin override).

    - **booking_id**: Booking to cancel
    - **reason**: Reason for cancellation (min 10 characters)

    Requires admin role.
    """
    try:
        booking = await admin_service.cancel_booking(
            booking_id=booking_id,
            admin=admin,
            reason=request_data.reason,
        )
        return BookingAdminListItem.model_validate(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Content Moderation
@router.get("/posts", response_model=PostListResponse)
async def list_posts(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
) -> PostListResponse:
    """
    List posts for content moderation.

    - **page**: Page number
    - **limit**: Items per page
    - **search**: Search in content, author name

    Requires admin role.
    """
    posts, total = await admin_service.list_posts(
        page=page,
        limit=limit,
        search=search,
    )

    post_items = [PostAdminListItem.model_validate(p) for p in posts]

    return PostListResponse(
        posts=post_items,
        total=total,
        page=page,
        limit=limit,
    )


@router.delete("/posts/{post_id}", response_model=MessageResponse)
async def delete_post(
    post_id: UUID,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> MessageResponse:
    """
    Delete a post (content moderation).

    - **post_id**: Post to delete

    Requires admin role.
    """
    try:
        await admin_service.delete_post(
            post_id=post_id,
            admin=admin,
        )
        return MessageResponse(message="Post deleted successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/comments/{comment_id}", response_model=MessageResponse)
async def delete_comment(
    comment_id: UUID,
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
) -> MessageResponse:
    """
    Delete a comment (content moderation).

    - **comment_id**: Comment to delete

    Requires admin role.
    """
    try:
        await admin_service.delete_comment(
            comment_id=comment_id,
            admin=admin,
        )
        return MessageResponse(message="Comment deleted successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# Report Management (Mocked until model exists)
@router.get("/reports", response_model=ReportListResponse)
async def list_reports(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    target_type: str | None = None,
    status: str | None = None,
) -> ReportListResponse:
    """
    List user reports for moderation.
    """
    # Return empty list for now as we don't have the model yet
    return ReportListResponse(
        reports=[],
        total=0,
        page=page,
        limit=limit,
    )


# Audit Log
@router.get("/audit-log", response_model=AuditLogResponse)
async def get_audit_log(
    admin: Annotated[User, Depends(get_admin)],
    admin_service: Annotated[AdminService, Depends(get_admin_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action_type: ActionType | None = None,
    admin_id: UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> AuditLogResponse:
    """
    Get audit log of admin actions.

    - **page**: Page number
    - **limit**: Items per page
    - **action_type**: Filter by action type
    - **admin_id**: Filter by admin ID
    - **start_date**: Start date (ISO format)
    - **end_date**: End date (ISO format)

    Requires admin role.
    """
    actions, total = await admin_service.get_audit_log(
        page=page,
        limit=limit,
        action_type=action_type,
        admin_id=admin_id,
        start_date=start_date,
        end_date=end_date,
    )

    action_items = [AuditLogItem.model_validate(a) for a in actions]

    return AuditLogResponse(
        actions=action_items,
        total=total,
        page=page,
        limit=limit,
    )
