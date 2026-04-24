"""
Admin service for administrative operations.

Handles user management, venue verification, booking oversight,
and content moderation with audit logging.
"""

import uuid
from typing import Annotated
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.booking import Booking
from app.models.post import Post, Comment
from app.models.admin import AdminAction, ActionType, TargetType
from app.core.database import get_db


class AdminService:
    """
    Service for admin operations.

    All admin actions are logged to AdminAction table for audit purposes.
    """

    def __init__(self, session: AsyncSession):
        """
        Initialize admin service.

        Args:
            session: Database session
        """
        self.session = session

    async def get_dashboard_metrics(self) -> dict[str, int | float]:
        """
        Get platform-wide metrics for admin dashboard.

        Returns:
            Dictionary with metrics: total_users, total_merchants, etc.
        """
        # Count users by role
        total_users = await self.session.scalar(
            select(func.count(User.id)).where(User.deleted_at.is_(None))
        )
        total_merchants = await self.session.scalar(
            select(func.count(User.id)).where(
                User.role == UserRole.MERCHANT,
                User.deleted_at.is_(None)
            )
        )
        active_users = await self.session.scalar(
            select(func.count(User.id)).where(
                User.is_active.is_(True),
                User.deleted_at.is_(None)
            )
        )

        # Count venues
        total_venues = await self.session.scalar(
            select(func.count(Venue.id)).where(Venue.deleted_at.is_(None))
        )
        verified_venues = await self.session.scalar(
            select(func.count(Venue.id)).where(
                Venue.is_verified.is_(True),
                Venue.deleted_at.is_(None)
            )
        )
        pending_verifications = await self.session.scalar(
            select(func.count(Venue.id)).where(
                Venue.is_verified.is_(False),
                Venue.deleted_at.is_(None)
            )
        )

        # Count bookings
        total_bookings = await self.session.scalar(
            select(func.count(Booking.id)).where(Booking.deleted_at.is_(None))
        )

        return {
            "total_users": total_users or 0,
            "total_merchants": total_merchants or 0,
            "total_venues": total_venues or 0,
            "total_bookings": total_bookings or 0,
            "active_users": active_users or 0,
            "verified_venues": verified_venues or 0,
            "pending_verifications": pending_verifications or 0,
            "total_revenue": None,  # TODO: Implement after payment system
        }

    async def list_users(
        self,
        page: int = 1,
        limit: int = 20,
        role: UserRole | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """
        List users with pagination and filters.

        Args:
            page: Page number (1-indexed)
            limit: Items per page
            role: Filter by user role
            is_active: Filter by active status
            search: Search in phone, full_name, email

        Returns:
            Tuple of (users list, total count)
        """
        query = select(User).where(User.deleted_at.is_(None))

        # Apply filters
        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active.is_(is_active))
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (User.phone.ilike(search_pattern)) |
                (User.full_name.ilike(search_pattern)) |
                (User.email.ilike(search_pattern))
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        # Apply pagination
        offset = (page - 1) * limit
        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        users = list(result.scalars().all())

        return users, total or 0

    async def ban_user(
        self,
        user_id: uuid.UUID,
        admin: User,
        reason: str,
    ) -> User:
        """
        Ban a user account.

        Args:
            user_id: User to ban
            admin: Admin performing the action
            reason: Reason for banning

        Returns:
            Updated user

        Raises:
            ValueError: If user not found or already banned
        """
        user = await self.session.get(User, user_id)
        if not user or user.deleted_at is not None:
            raise ValueError("User not found")

        if not user.is_active:
            raise ValueError("User is already banned")

        user.is_active = False

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.BAN_USER,
            target_type=TargetType.USER,
            target_id=user_id,
            reason=reason,
        )

        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def unban_user(
        self,
        user_id: uuid.UUID,
        admin: User,
        reason: str,
    ) -> User:
        """
        Unban a user account.

        Args:
            user_id: User to unban
            admin: Admin performing the action
            reason: Reason for unbanning

        Returns:
            Updated user

        Raises:
            ValueError: If user not found or not banned
        """
        user = await self.session.get(User, user_id)
        if not user or user.deleted_at is not None:
            raise ValueError("User not found")

        if user.is_active:
            raise ValueError("User is not banned")

        user.is_active = True

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.UNBAN_USER,
            target_type=TargetType.USER,
            target_id=user_id,
            reason=reason,
        )

        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def update_user_role(
        self,
        user_id: uuid.UUID,
        new_role: UserRole,
        admin: User,
        reason: str,
    ) -> User:
        """
        Change user role.

        Args:
            user_id: User to update
            new_role: New role to assign
            admin: Admin performing the action
            reason: Reason for role change

        Returns:
            Updated user

        Raises:
            ValueError: If user not found
        """
        user = await self.session.get(User, user_id)
        if not user or user.deleted_at is not None:
            raise ValueError("User not found")

        old_role = user.role
        user.role = new_role

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.UPDATE_USER_ROLE,
            target_type=TargetType.USER,
            target_id=user_id,
            reason=f"{reason} (Role: {old_role.value} -> {new_role.value})",
        )

        await self.session.commit()
        await self.session.refresh(user)

        return user

    async def list_merchants(
        self,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """
        List all merchant accounts.

        Args:
            page: Page number
            limit: Items per page
            search: Search in name, phone, email

        Returns:
            Tuple of (merchants list, total count)
        """
        query = select(User).where(
            User.role == UserRole.MERCHANT,
            User.deleted_at.is_(None)
        )

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (User.full_name.ilike(search_pattern)) |
                (User.phone.ilike(search_pattern)) |
                (User.email.ilike(search_pattern))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        offset = (page - 1) * limit
        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        merchants = list(result.scalars().all())

        return merchants, total or 0

    async def list_venues(
        self,
        page: int = 1,
        limit: int = 20,
        is_verified: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[Venue], int]:
        """
        List venues with pagination and filters.

        Args:
            page: Page number
            limit: Items per page
            is_verified: Filter by verification status
            search: Search in name, address

        Returns:
            Tuple of (venues list, total count)
        """
        query = select(Venue).where(Venue.deleted_at.is_(None))

        if is_verified is not None:
            query = query.where(Venue.is_verified.is_(is_verified))
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Venue.name.ilike(search_pattern)) |
                (Venue.address.ilike(search_pattern))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        offset = (page - 1) * limit
        query = query.order_by(Venue.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        venues = list(result.scalars().all())

        return venues, total or 0

    async def verify_venue(
        self,
        venue_id: uuid.UUID,
        verified: bool,
        admin: User,
        reason: str,
    ) -> Venue:
        """
        Verify or unverify a venue.

        Args:
            venue_id: Venue to verify/unverify
            verified: Verification status to set
            admin: Admin performing the action
            reason: Reason for verification change

        Returns:
            Updated venue

        Raises:
            ValueError: If venue not found
        """
        venue = await self.session.get(Venue, venue_id)
        if not venue or venue.deleted_at is not None:
            raise ValueError("Venue not found")

        venue.is_verified = verified

        # Log admin action
        action_type = ActionType.VERIFY_VENUE if verified else ActionType.UNVERIFY_VENUE
        await self._log_action(
            admin=admin,
            action_type=action_type,
            target_type=TargetType.VENUE,
            target_id=venue_id,
            reason=reason,
        )

        await self.session.commit()
        await self.session.refresh(venue)

        return venue


    async def update_venue_status(
        self,
        venue_id: uuid.UUID,
        is_active: bool,
        admin: User,
        reason: str,
    ) -> Venue:
        """
        Deactivate or activate a venue.

        Args:
            venue_id: Venue ID
            is_active: New status
            admin: Admin performing the action
            reason: Reason for status change

        Returns:
            Updated venue
        """
        venue = await self.session.get(Venue, venue_id)
        if not venue or venue.deleted_at is not None:
            raise ValueError("Venue not found")

        venue.is_active = is_active

        # Log action
        await self._log_action(
            admin=admin,
            action_type=ActionType.UPDATE_VENUE_STATUS if hasattr(ActionType, "UPDATE_VENUE_STATUS") else ActionType.VERIFY_VENUE,
            target_type=TargetType.VENUE,
            target_id=venue_id,
            reason=f"{reason} (Status: {'ACTIVE' if is_active else 'INACTIVE'})",
        )

        await self.session.commit()
        await self.session.refresh(venue)

        return venue

    async def list_bookings(
        self,
        page: int = 1,
        limit: int = 20,
        status: str | None = None,
        search: str | None = None,
    ) -> tuple[list[Booking], int]:
        """
        List all bookings platform-wide.

        Args:
            page: Page number
            limit: Items per page
            status: Filter by booking status
            search: Search in user name, venue name

        Returns:
            Tuple of (bookings list, total count)
        """
        query = select(Booking).where(Booking.deleted_at.is_(None))

        if status:
            query = query.where(Booking.status == status)
        if search:
            search_pattern = f"%{search}%"
            query = query.join(User).join(Venue).where(
                (User.full_name.ilike(search_pattern)) |
                (Venue.name.ilike(search_pattern))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        offset = (page - 1) * limit
        query = query.order_by(Booking.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        bookings = list(result.scalars().all())

        return bookings, total or 0

    async def cancel_booking(
        self,
        booking_id: uuid.UUID,
        admin: User,
        reason: str,
    ) -> Booking:
        """
        Cancel a booking (admin override).

        Args:
            booking_id: Booking to cancel
            admin: Admin performing the action
            reason: Reason for cancellation

        Returns:
            Updated booking

        Raises:
            ValueError: If booking not found or already cancelled
        """
        booking = await self.session.get(Booking, booking_id)
        if not booking or booking.deleted_at is not None:
            raise ValueError("Booking not found")

        from app.models.booking import BookingStatus
        if booking.status == BookingStatus.CANCELLED:
            raise ValueError("Booking is already cancelled")

        booking.status = BookingStatus.CANCELLED

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.CANCEL_BOOKING,
            target_type=TargetType.BOOKING,
            target_id=booking_id,
            reason=reason,
        )

        await self.session.commit()
        await self.session.refresh(booking)

        return booking


    async def get_booking_detail(
        self,
        booking_id: uuid.UUID,
    ) -> Booking:
        """
        Get detailed booking info with audit trail.

        Args:
            booking_id: Booking ID to fetch

        Returns:
            Booking object with joined relationships

        Raises:
            ValueError: If booking not found
        """
        from sqlalchemy.orm import selectinload
        query = (
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                selectinload(Booking.user),
                selectinload(Booking.venue).selectinload(Venue.merchant),
            )
        )
        result = await self.session.execute(query)
        booking = result.scalar_one_or_none()

        if not booking:
            raise ValueError("Booking not found")

        # Get audit trail for this booking
        audit_query = (
            select(AdminAction)
            .where(
                AdminAction.target_type == TargetType.BOOKING,
                AdminAction.target_id == booking_id
            )
            .order_by(AdminAction.created_at.desc())
        )
        audit_result = await self.session.execute(audit_query)
        booking.audit_trail = list(audit_result.scalars().all())

        return booking

    async def list_posts(
        self,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
    ) -> tuple[list[Post], int]:
        """
        List posts for content moderation.

        Args:
            page: Page number
            limit: Items per page
            search: Search in content, author name

        Returns:
            Tuple of (posts list, total count)
        """
        query = select(Post).where(Post.deleted_at.is_(None))

        if search:
            search_pattern = f"%{search}%"
            query = query.join(User).where(
                (Post.content.ilike(search_pattern)) |
                (User.full_name.ilike(search_pattern))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        offset = (page - 1) * limit
        query = query.order_by(Post.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        posts = list(result.scalars().all())

        return posts, total or 0

    async def delete_post(
        self,
        post_id: uuid.UUID,
        admin: User,
    ) -> None:
        """
        Delete a post (content moderation).

        Args:
            post_id: Post to delete
            admin: Admin performing the action

        Raises:
            ValueError: If post not found
        """
        post = await self.session.get(Post, post_id)
        if not post or post.deleted_at is not None:
            raise ValueError("Post not found")

        # Soft delete
        from datetime import datetime
        post.deleted_at = datetime.utcnow()

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.DELETE_POST,
            target_type=TargetType.POST,
            target_id=post_id,
            reason=f"Deleted post: {post.content[:100]}",
        )

        await self.session.commit()

    async def delete_comment(
        self,
        comment_id: uuid.UUID,
        admin: User,
    ) -> None:
        """
        Delete a comment (content moderation).

        Args:
            comment_id: Comment to delete
            admin: Admin performing the action

        Raises:
            ValueError: If comment not found
        """
        comment = await self.session.get(Comment, comment_id)
        if not comment or comment.deleted_at is not None:
            raise ValueError("Comment not found")

        # Soft delete
        from datetime import datetime
        comment.deleted_at = datetime.utcnow()

        # Log admin action
        await self._log_action(
            admin=admin,
            action_type=ActionType.DELETE_POST,
            target_type=TargetType.COMMENT,
            target_id=comment_id,
            reason=f"Deleted comment: {comment.content[:100]}",
        )

        await self.session.commit()

    async def get_audit_log(
        self,
        page: int = 1,
        limit: int = 20,
        action_type: ActionType | None = None,
        admin_id: uuid.UUID | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[list[AdminAction], int]:
        """
        Get audit log of admin actions.

        Args:
            page: Page number
            limit: Items per page
            action_type: Filter by action type
            admin_id: Filter by admin performing action
            start_date: Start of date range
            end_date: End of date range

        Returns:
            Tuple of (actions list, total count)
        """
        query = select(AdminAction).where(AdminAction.deleted_at.is_(None))

        if action_type:
            query = query.where(AdminAction.action_type == action_type)
        if admin_id:
            query = query.where(AdminAction.admin_id == admin_id)
        if start_date:
            query = query.where(AdminAction.created_at >= start_date)
        if end_date:
            query = query.where(AdminAction.created_at <= end_date)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query)

        offset = (page - 1) * limit
        query = query.order_by(AdminAction.created_at.desc()).offset(offset).limit(limit)

        result = await self.session.execute(query)
        actions = list(result.scalars().all())

        return actions, total or 0

    async def _log_action(
        self,
        admin: User,
        action_type: ActionType,
        target_type: TargetType,
        target_id: uuid.UUID,
        reason: str,
    ) -> None:
        """
        Log an admin action to the audit trail.

        Args:
            admin: Admin performing the action
            action_type: Type of action
            target_type: Type of target entity
            target_id: ID of target entity
            reason: Reason for the action
        """
        action = AdminAction(
            admin_id=admin.id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            reason=reason,
        )
        self.session.add(action)


# Dependency injection
async def get_admin_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdminService:
    """
    Get admin service instance.

    Args:
        session: Database session

    Returns:
        AdminService instance
    """
    return AdminService(session=session)
