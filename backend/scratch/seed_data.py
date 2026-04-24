import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_factory
from geoalchemy2.elements import WKTElement
from app.models.user import User, UserRole
from app.models.venue import Venue, VenueType
from app.models.booking import Booking, BookingStatus
from app.core.security import hash_password

async def seed_data():
    async with async_session_factory() as session:
        # 1. Create a Merchant
        merchant_phone = "+84900000001"
        result = await session.execute(select(User).where(User.phone == merchant_phone))
        merchant = result.scalar_one_or_none()
        
        if not merchant:
            print(f"Creating merchant {merchant_phone}...")
            merchant = User(
                phone=merchant_phone,
                password_hash=hash_password("1"),
                full_name="Chủ Sân Pickleball A",
                role=UserRole.MERCHANT,
                is_active=True,
                is_verified=True
            )
            session.add(merchant)
            await session.flush()
        
        # 2. Create a User
        user_phone = "+84900000002"
        result = await session.execute(select(User).where(User.phone == user_phone))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Creating user {user_phone}...")
            user = User(
                phone=user_phone,
                password_hash=hash_password("1"),
                full_name="Người Chơi Nguyễn Văn B",
                role=UserRole.USER,
                is_active=True,
                is_verified=True
            )
            session.add(user)
            await session.flush()

        # 3. Create Venues
        # Venue 1: Verified (Active)
        venue1_name = "Pickleball Center District 1"
        result = await session.execute(select(Venue).where(Venue.name == venue1_name))
        if not result.scalar_one_or_none():
            print(f"Creating verified venue: {venue1_name}...")
            v1 = Venue(
                merchant_id=merchant.id,
                name=venue1_name,
                address="123 Lê Lợi, Quận 1, TP.HCM",
                location=WKTElement("POINT(106.7011 10.7769)", srid=4326),
                venue_type=VenueType.PICKLEBALL,
                base_price_per_hour=150000,
                is_verified=True,
                is_active=True,
                rating=4.5
            )
            session.add(v1)

        # Venue 2: Pending Verification
        venue2_name = "Alobo Pickleball Club D7"
        result = await session.execute(select(Venue).where(Venue.name == venue2_name))
        if not result.scalar_one_or_none():
            print(f"Creating pending venue: {venue2_name}...")
            v2 = Venue(
                merchant_id=merchant.id,
                name=venue2_name,
                address="456 Nguyễn Văn Linh, Quận 7, TP.HCM",
                location=WKTElement("POINT(106.7211 10.7269)", srid=4326),
                venue_type=VenueType.PICKLEBALL,
                base_price_per_hour=120000,
                is_verified=False,
                is_active=True,
                rating=0.0
            )
            session.add(v2)

        # 4. Create more Users
        for i in range(3, 8):
            u_phone = f"+8490000000{i}"
            res = await session.execute(select(User).where(User.phone == u_phone))
            if not res.scalar_one_or_none():
                print(f"Creating sample user {u_phone}...")
                u = User(
                    phone=u_phone,
                    password_hash=hash_password("1"),
                    full_name=f"User Test {i}",
                    role=UserRole.USER,
                    is_active=True,
                    is_verified=True
                )
                session.add(u)
        
        await session.flush()

        # 5. Create Bookings
        # Get v1
        result = await session.execute(select(Venue).where(Venue.name == venue1_name))
        v1 = result.scalar_one()
        
        # Create a confirmed booking
        booking1 = Booking(
            user_id=user.id,
            venue_id=v1.id,
            booking_date=(datetime.now() + timedelta(days=1)).date(),
            total_price=300000,
            status=BookingStatus.CONFIRMED,
            paid_at=datetime.now()
        )
        session.add(booking1)

        # Create a pending booking
        booking2 = Booking(
            user_id=user.id,
            venue_id=v1.id,
            booking_date=(datetime.now() + timedelta(days=2)).date(),
            total_price=150000,
            status=BookingStatus.PENDING,
            paid_at=None
        )
        session.add(booking2)

        await session.commit()
        print("Seeding extended completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
