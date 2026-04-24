
import asyncio
import os
import sys
import uuid
from decimal import Decimal
from datetime import time

# Add backend root to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import async_session_factory
from app.models import User, Venue, VenueType, PricingTimeSlot, VenueService, DayType, UserRole
from app.models.court import Court

# Sample Pickleball Venue Templates
PICKLEBALL_TEMPLATES = [
    {
        "name": "Dai Kim Pickleball Complex",
        "district": "Hoang Mai",
        "lat": 20.9765721,
        "lng": 105.816989,
        "base_price": Decimal("220000"),
        "description": "Tổ hợp sân Pickleball hiện đại tại Đại Kim, không gian rộng rãi, thoáng đãng.",
    },
    {
        "name": "Sân bóng Pickleball Taydo Hoàng Mai",
        "district": "Hoang Mai",
        "lat": 20.9602687,
        "lng": 105.8654085,
        "base_price": Decimal("200000"),
        "description": "Sân chơi chất lượng cao tại Yên Sở, phục vụ cộng đồng yêu thể thao khu vực Hoàng Mai.",
    },
    {
        "name": "Sân Pickleball-Tennis CT3BX2 Bắc Linh Đàm",
        "district": "Hoang Mai",
        "lat": 20.9665319,
        "lng": 105.8232955,
        "base_price": Decimal("210000"),
        "description": "Sân kết hợp Pickleball và Tennis tại khu đô thị Bắc Linh Đàm, tiện nghi đầy đủ.",
    },
    {
        "name": "Eco Pickleball Club",
        "district": "Thanh Xuan",
        "lat": 20.9845678,
        "lng": 105.8062376,
        "base_price": Decimal("230000"),
        "description": "Câu lạc bộ Pickleball phong cách xanh, gần gũi thiên nhiên, mặt sân tiêu chuẩn quốc tế.",
    }
]

async def ensure_courts_for_existing_venues(session: AsyncSession):
    """Make sure all existing venues have at least 4 courts."""
    print("Checking existing venues for courts...")
    result = await session.execute(select(Venue))
    venues = result.scalars().all()
    
    for venue in venues:
        court_count_result = await session.execute(
            select(func.count(Court.id)).where(Court.venue_id == venue.id)
        )
        current_count = court_count_result.scalar() or 0
        
        target_count = 4
        if current_count < target_count:
            needed = target_count - current_count
            print(f"Adding {needed} courts to existing venue: {venue.name}")
            for i in range(needed):
                court = Court(
                    venue_id=venue.id,
                    name=f"Sân {current_count + i + 1}",
                    is_active=True
                )
                session.add(court)
    await session.flush()

async def create_new_pickleball_venues(session: AsyncSession):
    """Create new Pickleball venues with 4 courts each."""
    print(f"Creating {len(PICKLEBALL_TEMPLATES)} new Pickleball venues...")
    
    # Get a merchant user to assign these venues to
    merchant_result = await session.execute(
        select(User).where(User.role == UserRole.MERCHANT).limit(1)
    )
    merchant = merchant_result.scalar_one_or_none()
    
    if not merchant:
        print("No merchant found, creating a default one...")
        from app.core.security import hash_password
        merchant = User(
            phone="+84988777666",
            email="pickleball_owner@example.com",
            password_hash=hash_password("Merchant@123"),
            full_name="Pickleball Owner",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True
        )
        session.add(merchant)
        await session.flush()

    for template in PICKLEBALL_TEMPLATES:
        # Check if venue already exists by name
        exists_result = await session.execute(
            select(Venue).where(Venue.name == template["name"])
        )
        if exists_result.scalar_one_or_none():
            print(f"Venue '{template['name']}' already exists, skipping...")
            continue
            
        location_point = f"POINT({template['lng']} {template['lat']})"
        
        venue = Venue(
            merchant_id=merchant.id,
            name=template["name"],
            address=f"Khu đô thị mới, Quận {template['district']}, Hà Nội",
            district=template["district"],
            location=text(f"ST_GeomFromText('{location_point}', 4326)"),
            venue_type=VenueType.PICKLEBALL,
            description=template["description"],
            base_price_per_hour=template["base_price"],
            operating_hours={"open": "05:00", "close": "23:00"},
            amenities=["Parking", "Wifi", "Drinks", "Locker Room"],
            is_active=True,
            is_verified=True,
            images=["https://example.com/pball1.jpg", "https://example.com/pball2.jpg"]
        )
        session.add(venue)
        await session.flush()
        
        # Add 4 courts to this new venue
        for i in range(1, 5):
            court = Court(
                venue_id=venue.id,
                name=f"Court {i}",
                is_active=True
            )
            session.add(court)
        
        # Add pricing slots
        pricing_configs = [
            {"day": DayType.WEEKDAY, "start": time(5, 0), "end": time(23, 0), "factor": Decimal("1.0"), "is_default": True},
            {"day": DayType.WEEKDAY, "start": time(16, 0), "end": time(22, 0), "factor": Decimal("1.5"), "is_default": False},
            {"day": DayType.WEEKEND, "start": time(5, 0), "end": time(23, 0), "factor": Decimal("1.3"), "is_default": True}
        ]
        for config in pricing_configs:
            slot = PricingTimeSlot(
                venue_id=venue.id,
                day_type=config["day"],
                start_time=config["start"],
                end_time=config["end"],
                price=template["base_price"] * config["factor"],
                is_default=config["is_default"]
            )
            session.add(slot)
            
    await session.flush()

async def seed_multi_court():
    print("Starting Multi-Court Seed Process...")
    async with async_session_factory() as session:
        try:
            await ensure_courts_for_existing_venues(session)
            await create_new_pickleball_venues(session)
            await session.commit()
            print("Multi-Court Seeding Completed Successfully!")
        except Exception as e:
            await session.rollback()
            print(f"Seeding Error: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(seed_multi_court())
