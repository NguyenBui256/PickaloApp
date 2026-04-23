"""
Seed data script for Hanoi venues.

Creates sample venues across Hanoi districts with real coordinates
and realistic pricing data.
"""

import asyncio
import os
import sys
from decimal import Decimal

# Add backend root to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models import (
    User,
    Venue,
    VenueType,
    PricingTimeSlot,
    VenueService,
    DayType,
    UserRole,
)


# Hanoi districts with approximate coordinates
HANOI_DISTRICTS = {
    "Ba Dinh": (21.0350, 105.8340),
    "Cau Giay": (21.0180, 105.8030),
    "Dong Da": (21.0270, 105.8220),
    "Ha Dong": (20.9950, 105.7610),
    "Hai Ba Trung": (21.0020, 105.8490),
    "Hoan Kiem": (21.0285, 105.8542),
    "Hoang Mai": (21.0010, 105.8810),
    "Long Bien": (21.0500, 105.8840),
    "Tay Ho": (21.0660, 105.8260),
    "Thanh Xuan": (21.0060, 105.8090),
}

# Sample venue data
VENUE_TEMPLATES = [
    {
        "name": "Sân bóng Tin Đức",
        "type": VenueType.FOOTBALL_5,
        "base_price": Decimal("250000"),
        "description": "Sân bóng cỏ nhân tạo chuẩn FIFA, đèn LED, phòng thay đồ.",
    },
    {
        "name": "San An Binh Sport",
        "type": VenueType.FOOTBALL_5,
        "base_price": Decimal("300000"),
        "description": "Cơ sở vật chất hiện đại, bãi đậu xe rộng.",
    },
    {
        "name": "Sân bóng Việt Đức",
        "type": VenueType.FOOTBALL_7,
        "base_price": Decimal("400000"),
        "description": "Sân bóng lớn, tổ chức giải đấu chuyên nghiệp.",
    },
    {
        "name": "Tennis Court Cau Giay",
        "type": VenueType.TENNIS,
        "base_price": Decimal("200000"),
        "description": "Sân tennis professionals, học viện đào tạo.",
    },
    {
        "name": "Sân Cầu Lông Nhà Văn Hóa",
        "type": VenueType.BADMINTON,
        "base_price": Decimal("150000"),
        "description": "Sân cầu lông cao su, thi đấu đỉnh cao.",
    },
    {
        "name": "Basketball City",
        "type": VenueType.BASKETBALL,
        "base_price": Decimal("300000"),
        "description": "Sân bóng rổ chuẩn NBA, tổ chức giải đấu.",
    },
    {
        "name": "Volleyball Hall",
        "type": VenueType.VOLLEYBALL,
        "base_price": Decimal("200000"),
        "description": "Sân bóng chuyền trong nhà, huấn luyện viên chuyên nghiệp.",
    },
    {
        "name": "Swimming Pool Thong Nhat",
        "type": VenueType.SWIMMING,
        "base_price": Decimal("100000"),
        "description": "Hồ bơi Olympic, dạy bơi chuyên nghiệp.",
    },
    {
        "name": "Table Tennis Center",
        "type": VenueType.TABLE_TENNIS,
        "base_price": Decimal("100000"),
        "description": "Cơ sở bóng bàn đào tạo vận động viên.",
    },
    {
        "name": "Sân bóng mini Hoang Mai",
        "type": VenueType.FOOTBALL_5,
        "base_price": Decimal("280000"),
        "description": "Sân bóng nhỏ, phù hợp nhóm bạn, gia đình.",
    },
]

# Common services offered by venues
COMMON_SERVICES = [
    {"name": "Nước uống", "price": Decimal("10000"), "description": "Nước suối, nước ngọt"},
    {"name": "Thuê đồ bóng", "price": Decimal("30000"), "description": "Áo bóng, đồ giữ"},
    {"name": "Giày thể thao", "price": Decimal("50000"), "description": "Thuê giày các size"},
    {
        "name": "Bóng mới",
        "price": Decimal("80000"),
        "description": "Bóng chưa qua sử dụng",
    },
]


async def create_admin_user(session: AsyncSession) -> User:
    """Create default admin user."""
    from app.core.security import hash_password

    admin = User(
        phone="+84000000000",
        email="admin@alobo.vn",
        password_hash=hash_password("Admin@123456"),
        full_name="ALOBO Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    session.add(admin)
    await session.flush()
    print(f"✓ Created admin user: {admin.phone}")
    return admin


async def create_merchant_users(session: AsyncSession, count: int = 5) -> list[User]:
    """Create sample merchant users."""
    from app.core.security import hash_password

    merchants = []
    for i in range(count):
        merchant = User(
            phone=f"+8499000000{i}",
            email=f"merchant{i}@alobo.vn",
            password_hash=hash_password("Merchant@123456"),
            full_name=f"Merchant {i+1}",
            role=UserRole.MERCHANT,
            is_active=True,
            is_verified=True,
        )
        session.add(merchant)
        merchants.append(merchant)

    await session.flush()
    print(f"✓ Created {count} merchant users")
    return merchants


async def create_venues(
    session: AsyncSession, merchants: list[User], count_per_district: int = 2
) -> list[Venue]:
    """Create sample venues across Hanoi districts."""
    from sqlalchemy import text

    venues = []
    venue_id = 0

    for district, (lat, lng) in HANOI_DISTRICTS.items():
        for i in range(count_per_district):
            merchant = merchants[i % len(merchants)]
            template = VENUE_TEMPLATES[venue_id % len(VENUE_TEMPLATES)]

            # Slightly vary coordinates within the district
            lat_offset = (i * 0.01) - 0.01
            lng_offset = (i * 0.01) - 0.01

            # Create PostGIS point
            location_point = f"POINT({lng + lng_offset} {lat + lat_offset})"

            venue = Venue(
                merchant_id=merchant.id,
                name=f"{template['name']} - {district} {i+1}",
                address=f"Số {i*10 + 1} Đường Example, Quận {district}",
                district=district,
                location=text(location_point),  # Use text() for raw SQL
                venue_type=template["type"],
                description=template["description"],
                base_price_per_hour=template["base_price"],
                images={
                    "images": [
                        f"https://example.com/venue_{venue_id}_1.jpg",
                        f"https://example.com/venue_{venue_id}_2.jpg",
                    ]
                },
                operating_hours={"open": "05:00", "close": "23:00"},
                amenities={"parking": True, "showers": True, "lights": True},
                is_active=True,
                is_verified=i == 0,  # First venue verified
            )
            session.add(venue)
            venues.append(venue)
            venue_id += 1

    await session.flush()
    print(f"✓ Created {len(venues)} venues")
    return venues


async def create_pricing_slots(session: AsyncSession, venues: list[Venue]) -> None:
    """Create default pricing time slots for venues."""
    from sqlalchemy import text

    pricing_configs = [
        # Off-peak weekday
        {
            "day": DayType.WEEKDAY,
            "start": "05:00",
            "end": "16:00",
            "factor": Decimal("1.0"),
        },
        # Peak weekday evening
        {
            "day": DayType.WEEKDAY,
            "start": "16:00",
            "end": "22:00",
            "factor": Decimal("1.5"),
        },
        # Weekend all day
        {
            "day": DayType.WEEKEND,
            "start": "05:00",
            "end": "22:00",
            "factor": Decimal("1.2"),
        },
        # Holiday premium
        {
            "day": DayType.HOLIDAY,
            "start": "05:00",
            "end": "22:00",
            "factor": Decimal("1.5"),
        },
    ]

    count = 0
    for venue in venues:
        for config in pricing_configs:
            slot = PricingTimeSlot(
                venue_id=venue.id,
                day_type=config["day"],
                start_time=config["start"],
                end_time=config["end"],
                price_factor=config["factor"],
            )
            session.add(slot)
            count += 1

    await session.flush()
    print(f"✓ Created {count} pricing time slots")


async def create_venue_services(session: AsyncSession, venues: list[Venue]) -> None:
    """Create common services for venues."""
    count = 0
    for venue in venues:
        for service_data in COMMON_SERVICES:
            service = VenueService(
                venue_id=venue.id,
                name=service_data["name"],
                description=service_data["description"],
                price_per_unit=service_data["price"],
                is_available=True,
            )
            session.add(service)
            count += 1

    await session.flush()
    print(f"✓ Created {count} venue services")


async def seed_database() -> None:
    """Main seeding function."""
    print("🌱 Seeding database with sample data...")
    print("-" * 40)

    async with async_session_factory() as session:
        try:
            # Create admin user
            admin = await create_admin_user(session)

            # Create merchant users
            merchants = await create_merchant_users(session, count=5)

            # Create venues
            venues = await create_venues(session, merchants, count_per_district=2)

            # Create pricing slots
            await create_pricing_slots(session, venues)

            # Create venue services
            await create_venue_services(session, venues)

            # Commit all changes
            await session.commit()
            print("-" * 40)
            print("✅ Database seeding completed successfully!")

        except Exception as e:
            await session.rollback()
            print(f"❌ Seeding failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_database())
