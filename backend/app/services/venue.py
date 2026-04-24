"""
Venue business logic service.

Handles venue CRUD, geospatial search, availability checking,
and service/pricing management.
"""

import uuid
from datetime import datetime, time, timedelta
from decimal import Decimal
from typing import Annotated, Any

from fastapi import Depends
from sqlalchemy import select, func, and_, exists, literal, cast
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import functions as geofunc, Geometry, Geography

from app.core.database import get_db
from app.models.venue import Venue, VenueType, DayType, VenueService, PricingTimeSlot
from app.models.pricing_profile import PricingProfile, PricingProfileSlot
from app.models.booking import Booking, BookingStatus
from app.models.court import Court
from app.models.favorite import UserFavorite


class VenueManagementService:
    """
    Service for venue management operations.

    Methods:
        get_venues: List venues with filters and pagination
        get_venue_by_id: Get single venue details
        search_venues_by_radius: PostGIS geospatial search
        create_venue: Create new venue for merchant
        update_venue: Update venue with ownership check
        deactivate_venue: Soft delete venue
        get_venue_services: Get venue's additional services
        create_venue_service: Add new service
        update_venue_service: Update service details
        delete_venue_service: Remove service
        get_pricing_slots: Get pricing configuration
        create_pricing_slot: Add pricing time slot
        update_pricing_slot: Update pricing slot
        delete_pricing_slot: Remove pricing slot
        get_venue_availability: Check available time slots
        verify_venue: Admin verification
        get_hanoi_districts: List Hanoi districts
    """

    # Hanoi districts list
    HANOI_DISTRICTS = [
        "Ba Dinh", "Cau Giay", "Dong Da", "Hai Ba Trung",
        "Hoan Kiem", "Tay Ho", "Hoang Mai", "Long Bien",
        "Thanh Xuan", "Ha Dong", "Bac Tu Liem", "Nam Tu Liem",
        "Tay Ho", "Son Tay", "Ba Vi", "Chuong My",
        "Dan Phuong", "Gia Lam", "Hoai Duc", "Me Linh",
        "My Duc", "Phu Xuyen", "Phuc Tho", "Quoc Oai",
        "Soc Son", "Thach That", "Thanh Oai", "Thuong Tin",
        "Ung Hoa", "Phong Chau"
    ]

    def __init__(self, session: AsyncSession):
        """Initialize venue service with database session."""
        self.session = session

    async def get_venues(
        self,
        district: str | None = None,
        venue_type: VenueType | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        has_parking: bool | None = None,
        has_lights: bool | None = None,
        skip: int = 0,
        limit: int = 20,
        user_id: uuid.UUID | None = None,
        only_favorites: bool = False,
        user_lat: float | None = None,
        user_lng: float | None = None,
    ) -> tuple[list[Any], int]:
        """
        List venues with optional filters.

        Args:
            district: Filter by Hanoi district
            venue_type: Filter by venue type
            min_price: Minimum base price
            max_price: Maximum base price
            has_parking: Filter by parking availability
            has_lights: Filter by lights availability
            skip: Pagination offset
            limit: Results per page

        Returns:
            Tuple of (venues list, total count)
        """
        # Build query conditions
        conditions = [
            Venue.is_active.is_(True),
            Venue.deleted_at.is_(None),
        ]

        if district:
            conditions.append(Venue.district == district)

        if venue_type:
            conditions.append(Venue.venue_type == venue_type)

        if min_price is not None:
            conditions.append(Venue.base_price_per_hour >= min_price)

        if max_price is not None:
            conditions.append(Venue.base_price_per_hour <= max_price)

        # Note: Amenities filtering done at app level (stored as JSON)
        # TODO: Add dedicated columns for has_parking, has_lights for efficient filtering

        # Add favorite status check if user_id is provided
        is_fav_subquery = literal(False)
        if user_id:
            if only_favorites:
                is_fav_subquery = literal(True)
            else:
                is_fav_subquery = exists().where(
                    and_(
                        UserFavorite.venue_id == Venue.id,
                        UserFavorite.user_id == user_id
                    )
                ).correlate(Venue)

        # Build base query
        # Fetch coordinates directly using PostGIS functions for reliability
        from geoalchemy2 import Geometry
        from sqlalchemy import cast
        
        user_point = None
        if user_lat is not None and user_lng is not None:
            user_point = cast(geofunc.ST_SetSRID(geofunc.ST_MakePoint(user_lng, user_lat), 4326), Geography)

        distance_col = literal(0.0).label("distance")
        if user_point is not None:
            distance_col = geofunc.ST_Distance(Venue.location, user_point).label("distance")

        query = select(
            Venue, 
            is_fav_subquery.label("is_favorite"),
            func.ST_Y(cast(Venue.location, Geometry)).label("lat"),
            func.ST_X(cast(Venue.location, Geometry)).label("lng"),
            distance_col
        ).where(and_(*conditions))
        
        count_query = select(func.count()).select_from(Venue).where(and_(*conditions))

        if only_favorites and user_id:
            query = query.join(UserFavorite, UserFavorite.venue_id == Venue.id).where(UserFavorite.user_id == user_id)
            count_query = count_query.join(UserFavorite, UserFavorite.venue_id == Venue.id).where(UserFavorite.user_id == user_id)

        # Get total count
        count_result = await self.session.execute(count_query)
        total = count_result.scalar()

        # Get paginated results
        ordering = [Venue.created_at.desc()]
        if user_point is not None:
            ordering = [geofunc.ST_Distance(Venue.location, user_point).asc()]

        result = await self.session.execute(
            query
            .order_by(*ordering)
            .offset(skip)
            .limit(limit)
        )
        # Results are tuples of (Venue, is_favorite_bool, lat, lng, distance)
        venues_with_fav = list(result.all())

        return venues_with_fav, total

    async def get_merchant_venues(
        self,
        merchant_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[dict], int]:
        """
        List venues for a specific merchant with summary stats.

        Args:
            merchant_id: Merchant user ID
            skip: Pagination offset
            limit: Results per page

        Returns:
            Tuple of (list of venue data dicts, total count)
        """
        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(Venue).where(
                Venue.merchant_id == merchant_id,
                Venue.deleted_at.is_(None)
            )
        )
        total = count_result.scalar()

        # Get venues
        result = await self.session.execute(
            select(Venue)
            .where(
                Venue.merchant_id == merchant_id,
                Venue.deleted_at.is_(None)
            )
            .order_by(Venue.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        venues = result.scalars().all()

        # Get stats for each venue
        # Note: In a production app, we might want to do this in a single query with joins
        # or use a cached analytics table. For now, we'll do it per venue for simplicity.
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1).date()

        items = []
        for venue in venues:
            # Total bookings count
            booking_count_result = await self.session.execute(
                select(func.count()).select_from(Booking).where(
                    Booking.venue_id == venue.id,
                    Booking.status != BookingStatus.CANCELLED
                )
            )
            total_bookings = booking_count_result.scalar() or 0

            # Revenue MTD (Month To Date)
            revenue_result = await self.session.execute(
                select(func.sum(Booking.total_price)).where(
                    Booking.venue_id == venue.id,
                    Booking.booking_date >= start_of_month,
                    Booking.status == BookingStatus.COMPLETED
                )
            )
            revenue_mtd = float(revenue_result.scalar() or 0.0)

            items.append({
                "id": str(venue.id),
                "name": venue.name,
                "status": "active" if venue.is_active else "inactive",
                "total_bookings": total_bookings,
                "revenue_mtd": revenue_mtd,
                "rating": float(venue.rating or 0.0),
            })

        return items, total

    async def get_venue_by_id(self, venue_id: uuid.UUID) -> tuple[Venue | None, float | None, float | None]:
        """
        Get venue by ID with full details.

        Args:
            venue_id: Venue UUID

        Returns:
            Tuple of (Venue instance or None, latitude, longitude)
        """
        from geoalchemy2 import Geometry
        result = await self.session.execute(
            select(
                Venue,
                func.ST_Y(func.cast(Venue.location, Geometry)).label("lat"),
                func.ST_X(func.cast(Venue.location, Geometry)).label("lng"),
            ).where(
                Venue.id == venue_id,
                Venue.deleted_at.is_(None),
            )
        )
        row = result.first()
        if row:
            return row[0], row[1], row[2]
        return None, None, None

    async def search_venues_by_radius(
        self,
        lat: float,
        lng: float,
        radius: float = 5000,
        venue_type: VenueType | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        skip: int = 0,
        limit: int = 20,
        user_id: uuid.UUID | None = None,
        only_favorites: bool = False,
    ) -> tuple[list[Any], int]:
        """
        Search venues within radius using PostGIS.

        Uses ST_DWithin for efficient geospatial search.

        Args:
            lat: Center latitude
            lng: Center longitude
            radius: Search radius in meters (default: 5000m = 5km)
            venue_type: Optional venue type filter
            min_price: Optional minimum price filter
            max_price: Optional maximum price filter
            skip: Pagination offset
            limit: Results per page
            user_lat: Optional user latitude for relative distance
            user_lng: Optional user longitude for relative distance

        Returns:
            Tuple of (venues list, total count)
        """
        # Create point from coordinates
        point = cast(geofunc.ST_SetSRID(geofunc.ST_MakePoint(lng, lat), 4326), Geography)
        
        # Use provided user location if available, otherwise use search center
        user_point = point

        # Build conditions
        conditions = [
            Venue.is_active.is_(True),
            Venue.deleted_at.is_(None),
            geofunc.ST_DWithin(Venue.location, point, radius),  # PostGIS radius search
        ]

        if venue_type:
            conditions.append(Venue.venue_type == venue_type)

        if min_price is not None:
            conditions.append(Venue.base_price_per_hour >= min_price)

        if max_price is not None:
            conditions.append(Venue.base_price_per_hour <= max_price)

        # Add favorite status check if user_id is provided
        is_fav_subquery = literal(False)
        if user_id:
            if only_favorites:
                is_fav_subquery = literal(True)
            else:
                is_fav_subquery = exists().where(
                    and_(
                        UserFavorite.venue_id == Venue.id,
                        UserFavorite.user_id == user_id
                    )
                ).correlate(Venue)

        # Build queries
        query = select(
            Venue, 
            is_fav_subquery.label("is_favorite"),
            func.ST_Y(cast(Venue.location, Geometry)).label("lat"),
            func.ST_X(cast(Venue.location, Geometry)).label("lng"),
            geofunc.ST_Distance(Venue.location, user_point).label("distance")
        ).where(and_(*conditions))
        
        count_query = select(func.count()).select_from(Venue).where(and_(*conditions))

        if only_favorites and user_id:
            query = query.join(UserFavorite, UserFavorite.venue_id == Venue.id).where(UserFavorite.user_id == user_id)
            count_query = count_query.join(UserFavorite, UserFavorite.venue_id == Venue.id).where(UserFavorite.user_id == user_id)

        # Get total count
        count_result = await self.session.execute(count_query)
        total = count_result.scalar()

        # Get results ordered by distance
        result = await self.session.execute(
            query
            .order_by(geofunc.ST_Distance(Venue.location, point))
            .offset(skip)
            .limit(limit)
        )
        # Results are tuples of (Venue, is_favorite_bool, lat, lng, distance)
        venues_with_fav = list(result.all())

        return venues_with_fav, total

    async def create_venue(
        self,
        merchant_id: uuid.UUID,
        name: str,
        address: str,
        district: str | None,
        coordinates: dict[str, float],
        venue_type: VenueType,
        base_price_per_hour: Decimal,
        description: str | None = None,
        images: list[str] | None = None,
        cover_image: str | None = None,
        operating_hours: dict | None = None,
        amenities: list[str] | None = None,
        logo: str | None = None,
        booking_link: str | None = None,
    ) -> Venue:
        """
        Create new venue for merchant.

        Args:
            merchant_id: Merchant user ID
            name: Venue name
            address: Street address
            district: Hanoi district
            coordinates: {lat, lng} dict
            venue_type: Type of sports facility
            base_price_per_hour: Base pricing
            description: Optional description
            images: Optional image URLs
            operating_hours: Optional operating hours JSON
            amenities: Optional amenity list

        Returns:
            Created venue instance
        """
        # Create PostGIS point from coordinates
        lat = coordinates["lat"]
        lng = coordinates["lng"]
        location_point = geofunc.ST_SetSRID(
            geofunc.ST_MakePoint(lng, lat),
            4326  # WGS84 SRID
        )

        venue = Venue(
            merchant_id=merchant_id,
            name=name,
            address=address,
            district=district,
            location=location_point,  # type: ignore
            venue_type=venue_type,
            description=description,
            images=images,
            cover_image=cover_image,
            operating_hours=operating_hours,
            amenities=amenities,
            logo=logo,
            booking_link=booking_link,
            base_price_per_hour=base_price_per_hour,
            is_active=True,
            is_verified=False,
        )

        self.session.add(venue)
        await self.session.flush()

        return venue

    async def update_venue(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        **updates: Any,
    ) -> Venue | None:
        """
        Update venue with ownership verification.

        Args:
            venue_id: Venue UUID to update
            merchant_id: Merchant ID for ownership check
            **updates: Fields to update

        Returns:
            Updated venue or None if not found/not owned

        Raises:
            ValueError: If venue not owned by merchant
        """
        venue = await self.get_venue_by_id(venue_id)

        if not venue:
            return None

        # Verify ownership
        if venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to update this venue")

        # Update fields
        for field, value in updates.items():
            if value is not None and hasattr(venue, field):
                if field == "coordinates":
                    # Handle PostGIS location update
                    lat = value["lat"]
                    lng = value["lng"]
                    venue.location = geofunc.ST_SetSRID(  # type: ignore
                        geofunc.ST_MakePoint(lng, lat),
                        4326
                    )
                else:
                    setattr(venue, field, value)

        await self.session.flush()
        return venue

    async def deactivate_venue(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """
        Soft delete venue (merchant deactivation).

        Args:
            venue_id: Venue UUID
            merchant_id: Merchant ID for ownership check

        Returns:
            True if deactivated

        Raises:
            ValueError: If venue not owned by merchant
        """
        venue = await self.get_venue_by_id(venue_id)

        if not venue:
            return False

        # Verify ownership
        if venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to deactivate this venue")

        # Soft delete
        venue.is_active = False
        venue.deleted_at = datetime.utcnow()

        await self.session.flush()
        return True

    async def get_venue_services(self, venue_id: uuid.UUID) -> list[VenueService]:
        """
        Get all services for a venue.

        Args:
            venue_id: Venue UUID

        Returns:
            List of venue services
        """
        result = await self.session.execute(
            select(VenueService).where(
                VenueService.venue_id == venue_id,
                VenueService.is_available.is_(True),
            )
        )
        return list(result.scalars().all())

    async def create_venue_service(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        name: str,
        price_per_unit: Decimal,
        description: str | None = None,
    ) -> VenueService | None:
        """
        Add new service to venue.

        Args:
            venue_id: Venue UUID
            merchant_id: Merchant ID for ownership check
            name: Service name
            price_per_unit: Price per unit
            description: Optional description

        Returns:
            Created service or None

        Raises:
            ValueError: If venue not owned by merchant
        """
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to add services to this venue")

        service = VenueService(
            venue_id=venue_id,
            name=name,
            description=description,
            price_per_unit=price_per_unit,
            is_available=True,
        )

        self.session.add(service)
        await self.session.flush()

        return service

    async def update_venue_service(
        self,
        service_id: uuid.UUID,
        merchant_id: uuid.UUID,
        **updates: Any,
    ) -> VenueService | None:
        """
        Update venue service with ownership check.

        Args:
            service_id: Service ID
            merchant_id: Merchant ID
            **updates: Fields to update

        Returns:
            Updated service or None
        """
        result = await self.session.execute(
            select(VenueService).where(VenueService.id == service_id)
        )
        service = result.scalar_one_or_none()

        if not service:
            return None

        # Verify venue ownership
        venue = await self.get_venue_by_id(service.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to update this service")

        # Update fields
        for field, value in updates.items():
            if value is not None and hasattr(service, field):
                setattr(service, field, value)

        await self.session.flush()
        return service

    async def delete_venue_service(
        self,
        service_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """
        Remove venue service (soft delete by setting unavailable).

        Args:
            service_id: Service ID
            merchant_id: Merchant ID

        Returns:
            True if deleted
        """
        result = await self.session.execute(
            select(VenueService).where(VenueService.id == service_id)
        )
        service = result.scalar_one_or_none()

        if not service:
            return False

        # Verify ownership
        venue = await self.get_venue_by_id(service.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to delete this service")

        service.is_available = False
        await self.session.flush()

        return True

    async def get_pricing_slots(self, venue_id: uuid.UUID) -> list[PricingTimeSlot]:
        """
        Get all pricing slots for venue.

        Args:
            venue_id: Venue UUID

        Returns:
            List of pricing slots
        """
        result = await self.session.execute(
            select(PricingTimeSlot)
            .where(PricingTimeSlot.venue_id == venue_id)
            .order_by(PricingTimeSlot.day_type, PricingTimeSlot.start_time)
        )
        return list(result.scalars().all())

    async def create_pricing_slot(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        day_type: DayType,
        start_time: str,
        end_time: str,
        price: Decimal,
        is_default: bool = False,
        days_of_week: list[int] | None = None,
        title: str | None = None,
    ) -> PricingTimeSlot | None:
        """
        Add pricing time slot.

        Args:
            venue_id: Venue UUID
            merchant_id: Merchant ID for ownership check
            day_type: Day type for pricing
            start_time: Start time (HH:MM)
            end_time: End time (HH:MM)
            price: Price amount (VND)
            is_default: Whether this is the default slot for the day type

        Returns:
            Created pricing slot or None
        """
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to add pricing to this venue")

        slot = PricingTimeSlot(
            venue_id=venue_id,
            title=title,
            day_type=day_type,
            days_of_week=days_of_week,
            start_time=time.fromisoformat(start_time),
            end_time=time.fromisoformat(end_time),
            price=price,
            is_default=is_default,
        )

        self.session.add(slot)
        await self.session.flush()

        return slot

    async def bulk_create_pricing_slots(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        days_of_week: list[int],
        slots_data: list[dict[str, Any]],
        title: str | None = None,
        day_type: DayType = DayType.WEEKDAY,
    ) -> list[PricingTimeSlot]:
        """
        Create multiple pricing slots for a group of days.
        """
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to manage pricing for this venue")

        created_slots = []
        
        # Sort and validate for overlaps
        non_default_slots = [s for s in slots_data if not s.get("is_default", False)]
        if len(non_default_slots) > 1:
            sorted_slots = sorted(non_default_slots, key=lambda x: x["start_time"])
            for i in range(len(sorted_slots) - 1):
                if sorted_slots[i]["end_time"] > sorted_slots[i+1]["start_time"]:
                    raise ValueError(f"Khung giờ bị chồng lấn: {sorted_slots[i]['start_time']}-{sorted_slots[i]['end_time']} và {sorted_slots[i+1]['start_time']}-{sorted_slots[i+1]['end_time']}")

        for s_data in slots_data:
            slot = PricingTimeSlot(
                venue_id=venue_id,
                title=title,
                day_type=day_type,
                days_of_week=days_of_week,
                start_time=time.fromisoformat(s_data["start_time"]),
                end_time=time.fromisoformat(s_data["end_time"]),
                price=s_data["price"],
                is_default=s_data.get("is_default", False),
            )
            self.session.add(slot)
            created_slots.append(slot)

        await self.session.flush()
        return created_slots

    async def update_pricing_slot(
        self,
        slot_id: uuid.UUID,
        merchant_id: uuid.UUID,
        **updates: Any,
    ) -> PricingTimeSlot | None:
        """
        Update pricing slot with ownership check.

        Args:
            slot_id: Pricing slot ID
            merchant_id: Merchant ID
            **updates: Fields to update

        Returns:
            Updated slot or None
        """
        result = await self.session.execute(
            select(PricingTimeSlot).where(PricingTimeSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            return None

        # Verify ownership
        venue = await self.get_venue_by_id(slot.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to update this pricing")

        # Update fields
        for field, value in updates.items():
            if value is not None and hasattr(slot, field):
                if field in ("start_time", "end_time"):
                    setattr(slot, field, time.fromisoformat(value))
                else:
                    setattr(slot, field, value)

        await self.session.flush()
        return slot

    async def delete_pricing_slot(
        self,
        slot_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """
        Delete pricing slot.

        Args:
            slot_id: Pricing slot ID
            merchant_id: Merchant ID

        Returns:
            True if deleted
        """
        result = await self.session.execute(
            select(PricingTimeSlot).where(PricingTimeSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            return False

        # Verify ownership
        venue = await self.get_venue_by_id(slot.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to delete this pricing")

        await self.session.delete(slot)
        await self.session.flush()

        return True

    # ===== Pricing Profile Management =====

    async def get_pricing_profiles(self, merchant_id: uuid.UUID) -> list[PricingProfile]:
        """Get all pricing profiles for a merchant."""
        result = await self.session.execute(
            select(PricingProfile).where(PricingProfile.merchant_id == merchant_id)
        )
        return list(result.scalars().all())

    async def create_pricing_profile(
        self,
        merchant_id: uuid.UUID,
        name: str,
        description: str | None = None,
        slots: list[dict] | None = None,
    ) -> PricingProfile:
        """Create a new pricing profile with optional slots."""
        profile = PricingProfile(
            merchant_id=merchant_id,
            name=name,
            description=description,
        )
        self.session.add(profile)
        await self.session.flush()

        if slots:
            for s in slots:
                slot = PricingProfileSlot(
                    profile_id=profile.id,
                    day_type=s["day_type"],
                    start_time=time.fromisoformat(s["start_time"]),
                    end_time=time.fromisoformat(s["end_time"]),
                    price=s["price"],
                    is_default=s.get("is_default", False),
                )
                self.session.add(slot)
            await self.session.flush()

        return profile

    async def update_pricing_profile(
        self,
        profile_id: uuid.UUID,
        merchant_id: uuid.UUID,
        **updates: Any,
    ) -> PricingProfile | None:
        """Update pricing profile details."""
        result = await self.session.execute(
            select(PricingProfile).where(
                PricingProfile.id == profile_id,
                PricingProfile.merchant_id == merchant_id,
            )
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return None

        for field, value in updates.items():
            if value is not None and hasattr(profile, field):
                setattr(profile, field, value)

        await self.session.flush()
        return profile

    async def delete_pricing_profile(
        self,
        profile_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """Delete a pricing profile."""
        result = await self.session.execute(
            select(PricingProfile).where(
                PricingProfile.id == profile_id,
                PricingProfile.merchant_id == merchant_id,
            )
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return False

        await self.session.delete(profile)
        await self.session.flush()
        return True

    async def apply_pricing_profile(
        self,
        venue_id: uuid.UUID,
        profile_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """Apply a pricing profile to a venue (replaces existing slots)."""
        # Verify venue ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to manage pricing for this venue")

        # Verify profile ownership
        result = await self.session.execute(
            select(PricingProfile).where(
                PricingProfile.id == profile_id,
                PricingProfile.merchant_id == merchant_id,
            )
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return False

        # Clear existing pricing slots for the venue
        from sqlalchemy import delete
        await self.session.execute(
            delete(PricingTimeSlot).where(PricingTimeSlot.venue_id == venue_id)
        )

        # Copy slots from profile to venue
        for p_slot in profile.slots:
            v_slot = PricingTimeSlot(
                venue_id=venue_id,
                day_type=p_slot.day_type,
                days_of_week=p_slot.days_of_week,
                start_time=p_slot.start_time,
                end_time=p_slot.end_time,
                price=p_slot.price,
                is_default=p_slot.is_default,
            )
            self.session.add(v_slot)

        await self.session.flush()
        return True

    async def get_venue_availability(
        self,
        venue_id: uuid.UUID,
        date: datetime,
    ) -> dict[str, Any]:
        """
        Check available time slots for venue on given date.

        Args:
            venue_id: Venue UUID
            date: Date to check availability for

        Returns:
            Dict with venue_id, date, slots list, open_time, close_time
        """
        venue = await self.get_venue_by_id(venue_id)

        if not venue:
            return {
                "venue_id": str(venue_id),
                "date": date.date().isoformat(),
                "slots": [],
                "open_time": "05:00",
                "close_time": "23:00",
            }

        # Get operating hours or use defaults
        hours = venue.operating_hours or {}
        open_time = hours.get("open", "05:00")
        close_time = hours.get("close", "23:00")

        # Get existing bookings for the date
        booking_result = await self.session.execute(
            select(Booking).where(
                Booking.venue_id == venue_id,
                Booking.booking_date == date.date(),
                Booking.status.in_([
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                    BookingStatus.COMPLETED,
                ]),
            )
        )
        bookings = list(booking_result.scalars().all())

        # Generate hourly slots
        slots = []
        open_hour = int(open_time.split(":")[0])
        close_hour = int(close_time.split(":")[0])

        for hour in range(open_hour, close_hour):
            slot_start = datetime.combine(date.date(), time(hour=hour))
            slot_end = datetime.combine(date.date(), time(hour=hour + 1))

            # Check if slot is booked
            is_booked = any(
                b.start_time < slot_end.time() and b.end_time > slot_start.time()
                for b in bookings
            )

            slots.append({
                "start_time": f"{hour:02d}:00",
                "end_time": f"{hour + 1:02d}:00",
                "available": not is_booked,
            })

        return {
            "venue_id": str(venue_id),
            "date": date.date().isoformat(),
            "slots": slots,
            "open_time": open_time,
            "close_time": close_time,
        }

    async def verify_venue(self, venue_id: uuid.UUID) -> bool:
        """
        Admin verification of venue.

        Args:
            venue_id: Venue UUID

        Returns:
            True if verified
        """
        venue = await self.get_venue_by_id(venue_id)

        if not venue:
            return False

        venue.is_verified = True
        await self.session.flush()

        return True

    async def get_hanoi_districts(self) -> list[str]:
        """
        Get list of Hanoi districts.

        Returns:
            List of district names
        """
        return self.HANOI_DISTRICTS.copy()

    # ===== Court Management =====

    async def get_venue_courts(self, venue_id: uuid.UUID) -> list[Court]:
        """Get all courts for a venue."""
        result = await self.session.execute(
            select(Court).where(Court.venue_id == venue_id)
        )
        return list(result.scalars().all())

    async def create_court(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        name: str,
        is_active: bool = True,
    ) -> Court:
        """Create a new court for a venue."""
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to add courts to this venue")

        court = Court(
            venue_id=venue_id,
            name=name,
            is_active=is_active,
        )
        self.session.add(court)
        await self.session.flush()
        return court

    async def update_court(
        self,
        court_id: uuid.UUID,
        merchant_id: uuid.UUID,
        **updates: Any,
    ) -> Court | None:
        """Update court details."""
        result = await self.session.execute(
            select(Court).where(Court.id == court_id)
        )
        court = result.scalar_one_or_none()
        if not court:
            return None

        # Verify ownership
        venue = await self.get_venue_by_id(court.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to update this court")

        for field, value in updates.items():
            if value is not None and hasattr(court, field):
                setattr(court, field, value)

        await self.session.flush()
        return court

    async def delete_court(
        self,
        court_id: uuid.UUID,
        merchant_id: uuid.UUID,
    ) -> bool:
        """Delete a court with ownership verification."""
        result = await self.session.execute(
            select(Court).where(Court.id == court_id)
        )
        court = result.scalar_one_or_none()
        if not court:
            return False

        # Verify ownership
        venue = await self.get_venue_by_id(court.venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to delete this court")

        await self.session.delete(court)
        await self.session.flush()
        return True

    async def bulk_create_courts(
        self,
        venue_id: uuid.UUID,
        merchant_id: uuid.UUID,
        names: list[str],
        is_active: bool = True,
    ) -> list[Court]:
        """Bulk create multiple courts for a venue."""
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to add courts to this venue")

        courts = []
        for name in names:
            court = Court(
                venue_id=venue_id,
                name=name,
                is_active=is_active,
            )
            self.session.add(court)
            courts.append(court)

        await self.session.flush()
        return courts


async def get_venue_service(session: Annotated[AsyncSession, Depends(get_db)]) -> VenueManagementService:
    """
    Dependency to get venue service instance.

    Args:
        session: Database session

    Returns:
        VenueManagementService instance
    """
    return VenueManagementService(session)
