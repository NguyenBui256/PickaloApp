"""
Analytics service for admin dashboard insights.

Handles revenue trends, booking statistics, user growth metrics,
and venue performance analytics.
"""

import uuid
from typing import Annotated
from datetime import date, datetime, timedelta
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType
from app.models.booking import Booking, BookingStatus
from app.core.database import get_db


class AnalyticsService:
    """
    Service for analytics and reporting.

    Provides aggregated data for admin dashboard insights.
    """

    def __init__(self, session: AsyncSession):
        """
        Initialize analytics service.

        Args:
            session: Database session
        """
        self.session = session

    async def get_revenue_trends(
        self,
        start_date: date,
        end_date: date,
        period_type: str = "daily",
    ) -> dict:
        """
        Get revenue trends for a time period.

        Args:
            start_date: Start date for analytics
            end_date: End date for analytics
            period_type: Granularity (daily, weekly, monthly)

        Returns:
            Dictionary with revenue trend data
        """
        # For now, return placeholder data
        # TODO: Implement actual revenue calculation after payment system
        data_points = []
        current_date = start_date

        while current_date <= end_date:
            data_points.append({
                "date": current_date.isoformat(),
                "revenue": 0.0,  # TODO: Calculate from payments
                "booking_count": 0,  # TODO: Count bookings for this date
            })
            current_date += timedelta(days=1)

        return {
            "period": period_type,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_revenue": 0.0,  # TODO: Sum of all payments
            "data_points": data_points,
        }

    async def get_booking_statistics(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:
        """
        Get booking statistics for a time period.

        Args:
            start_date: Start date for analytics
            end_date: End date for analytics

        Returns:
            Dictionary with booking statistics
        """
        # Count bookings by status
        total_result = await self.session.scalar(
            select(func.count(Booking.id)).where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Booking.deleted_at.is_(None),
            )
        )

        confirmed_result = await self.session.scalar(
            select(func.count(Booking.id)).where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Booking.status == BookingStatus.CONFIRMED,
                Booking.deleted_at.is_(None),
            )
        )

        cancelled_result = await self.session.scalar(
            select(func.count(Booking.id)).where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Booking.status == BookingStatus.CANCELLED,
                Booking.deleted_at.is_(None),
            )
        )

        total_bookings = total_result or 0
        confirmed_bookings = confirmed_result or 0
        cancelled_bookings = cancelled_result or 0

        # Calculate completion rate
        completion_rate = (
            (confirmed_bookings / total_bookings * 100)
            if total_bookings > 0
            else 0.0
        )

        # Average booking value (placeholder)
        average_booking_value = 0.0  # TODO: Calculate from actual bookings

        # Popular time slots (hour of day)
        time_slot_stats = []
        for hour in range(5, 23):  # 5 AM to 10 PM
            count_result = await self.session.scalar(
                select(func.count(Booking.id)).where(
                    Booking.created_at >= start_date,
                    Booking.created_at <= end_date,
                    func.extract("hour", Booking.start_time) == hour,
                    Booking.deleted_at.is_(None),
                )
            )
            time_slot_stats.append({
                "hour": hour,
                "booking_count": count_result or 0,
                "utilization_rate": 0.0,  # TODO: Calculate based on capacity
            })

        # Sort by booking count
        time_slot_stats.sort(key=lambda x: x["booking_count"], reverse=True)

        return {
            "total_bookings": total_bookings,
            "confirmed_bookings": confirmed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "completion_rate": round(completion_rate, 2),
            "average_booking_value": round(average_booking_value, 2),
            "popular_time_slots": time_slot_stats[:10],  # Top 10
            "daily_breakdown": [],  # TODO: Implement daily breakdown
        }

    async def get_user_growth(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:
        """
        Get user growth analytics.

        Args:
            start_date: Start date for analytics
            end_date: End date for analytics

        Returns:
            Dictionary with user growth data
        """
        # Total users
        total_users = await self.session.scalar(
            select(func.count(User.id)).where(User.deleted_at.is_(None))
        )

        # New users in period
        new_users = await self.session.scalar(
            select(func.count(User.id)).where(
                User.created_at >= start_date,
                User.created_at <= end_date,
                User.deleted_at.is_(None),
            )
        )

        # Active users in period (users with bookings)
        active_users_result = await self.session.execute(
            select(func.count(func.distinct(Booking.user_id))).where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Booking.deleted_at.is_(None),
            )
        )
        active_users = active_users_result.scalar() or 0

        # Calculate growth rate
        previous_users = await self.session.scalar(
            select(func.count(User.id)).where(
                User.created_at < start_date,
                User.deleted_at.is_(None),
            )
        )
        growth_rate = (
            (new_users / previous_users * 100)
            if previous_users and previous_users > 0
            else 0.0
        )

        # User breakdown by role
        user_breakdown = {}
        for role in UserRole:
            count = await self.session.scalar(
                select(func.count(User.id)).where(
                    User.role == role,
                    User.deleted_at.is_(None),
                )
            )
            user_breakdown[role.value] = count or 0

        return {
            "total_users": total_users or 0,
            "new_users_this_period": new_users or 0,
            "active_users_this_period": active_users,
            "growth_rate": round(growth_rate, 2),
            "user_breakdown": user_breakdown,
            "daily_signups": [],  # TODO: Implement daily breakdown
        }

    async def get_venue_performance(
        self,
        start_date: date,
        end_date: date,
        limit: int = 10,
    ) -> dict:
        """
        Get venue performance rankings.

        Args:
            start_date: Start date for analytics
            end_date: End date for analytics
            limit: Number of top venues to return

        Returns:
            Dictionary with venue performance data
        """
        # Total venues
        total_venues = await self.session.scalar(
            select(func.count(Venue.id)).where(Venue.deleted_at.is_(None))
        )

        # Active venues (have bookings)
        active_venues_result = await self.session.execute(
            select(func.count(func.distinct(Booking.venue_id))).where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Booking.deleted_at.is_(None),
            )
        )
        active_venues = active_venues_result.scalar() or 0

        # Verified venues
        verified_venues = await self.session.scalar(
            select(func.count(Venue.id)).where(
                Venue.is_verified.is_(True),
                Venue.deleted_at.is_(None),
            )
        )

        # Top performing venues by booking count
        top_venues_result = await self.session.execute(
            select(
                Venue.id,
                Venue.name,
                User.full_name.label("merchant_name"),
                func.count(Booking.id).label("booking_count"),
            )
            .join(User, Venue.merchant_id == User.id)
            .outerjoin(Booking, Venue.id == Booking.venue_id)
            .where(
                Booking.created_at >= start_date,
                Booking.created_at <= end_date,
                Venue.deleted_at.is_(None),
                Booking.deleted_at.is_(None),
            )
            .group_by(Venue.id, Venue.name, User.full_name)
            .order_by(desc("booking_count"))
            .limit(limit)
        )

        top_performing_venues = []
        for row in top_venues_result:
            top_performing_venues.append({
                "venue_id": str(row.id),
                "venue_name": row.name,
                "merchant_name": row.merchant_name,
                "total_bookings": row.booking_count,
                "total_revenue": 0.0,  # TODO: Calculate from payments
                "average_rating": None,  # TODO: Calculate from reviews
                "verification_status": False,  # TODO: Get from venue
            })

        # Venue type breakdown
        venue_type_breakdown = {}
        for venue_type in VenueType:
            count = await self.session.scalar(
                select(func.count(Venue.id)).where(
                    Venue.venue_type == venue_type,
                    Venue.deleted_at.is_(None),
                )
            )
            venue_type_breakdown[venue_type.value] = count or 0

        return {
            "total_venues": total_venues or 0,
            "active_venues": active_venues,
            "verified_venues": verified_venues or 0,
            "top_performing_venues": top_performing_venues,
            "venue_type_breakdown": venue_type_breakdown,
        }


# Dependency injection
async def get_analytics_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AnalyticsService:
    """
    Get analytics service instance.

    Args:
        session: Database session

    Returns:
        AnalyticsService instance
    """
    return AnalyticsService(session=session)
