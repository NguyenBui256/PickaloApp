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
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import functions as geofunc

from app.core.database import get_db
from app.models.venue import Venue, VenueType, DayType, VenueService, PricingTimeSlot
from app.models.booking import Booking, BookingStatus


class VenueService:
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
    ) -> tuple[list[Venue], int]:
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

        # Get total count
        count_result = await self.session.execute(
            select(func.count()).select_from(Venue).where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get paginated results
        result = await self.session.execute(
            select(Venue)
            .where(and_(*conditions))
            .order_by(Venue.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        venues = list(result.scalars().all())

        return venues, total

    async def get_venue_by_id(self, venue_id: uuid.UUID) -> Venue | None:
        """
        Get venue by ID with full details.

        Args:
            venue_id: Venue UUID

        Returns:
            Venue instance or None if not found
        """
        result = await self.session.execute(
            select(Venue).where(
                Venue.id == venue_id,
                Venue.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

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
    ) -> tuple[list[Venue], int]:
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

        Returns:
            Tuple of (venues list, total count)
        """
        # Create point from coordinates
        point = geofunc.ST_SetSRID(geofunc.ST_MakePoint(lng, lat), 4326)

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

        # Get total count
        count_result = await self.session.execute(
            select(func.count())
            .select_from(Venue)
            .where(and_(*conditions))
        )
        total = count_result.scalar()

        # Get results ordered by distance
        result = await self.session.execute(
            select(Venue)
            .where(and_(*conditions))
            .order_by(geofunc.ST_Distance(Venue.location, point))
            .offset(skip)
            .limit(limit)
        )
        venues = list(result.scalars().all())

        return venues, total

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
        operating_hours: dict | None = None,
        amenities: list[str] | None = None,
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
            operating_hours=operating_hours,
            amenities=amenities,
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
        service_id: int,
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
        service_id: int,
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
        price_factor: Decimal,
    ) -> PricingTimeSlot | None:
        """
        Add pricing time slot.

        Args:
            venue_id: Venue UUID
            merchant_id: Merchant ID for ownership check
            day_type: Day type for pricing
            start_time: Start time (HH:MM)
            end_time: End time (HH:MM)
            price_factor: Price multiplier

        Returns:
            Created pricing slot or None
        """
        # Verify ownership
        venue = await self.get_venue_by_id(venue_id)
        if not venue or venue.merchant_id != merchant_id:
            raise ValueError("Not authorized to add pricing to this venue")

        slot = PricingTimeSlot(
            venue_id=venue_id,
            day_type=day_type,
            start_time=time.fromisoformat(start_time),
            end_time=time.fromisoformat(end_time),
            price_factor=price_factor,
        )

        self.session.add(slot)
        await self.session.flush()

        return slot

    async def update_pricing_slot(
        self,
        slot_id: int,
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
        slot_id: int,
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
                b.start_time < slot_end.time() and 
                (datetime.combine(date.date(), b.start_time) + timedelta(hours=b.duration_hours)).time() > slot_start.time()
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


async def get_venue_service(session: Annotated[AsyncSession, Depends(get_db)]) -> VenueService:
    """
    Dependency to get venue service instance.

    Args:
        session: Database session

    Returns:
        VenueService instance
    """
    return VenueService(session)
