
import asyncio
import os
import sys
import uuid
from decimal import Decimal
from datetime import date, time, datetime, timedelta

# Add backend root to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models import User, Venue, Court, Booking, BookingSlot, UserRole
from app.models.booking import BookingStatus

# List of test users to ensure they exist and are verified
TEST_USERS = [
    {"phone": "+84987654321", "full_name": "User One", "email": "user1@example.com"},
    {"phone": "+84843017170", "full_name": "Trong Khoi", "email": "user2@example.com"},
    {"phone": "+84912345678", "full_name": "User Three", "email": "user3@example.com"},
    {"phone": "+84900111222", "full_name": "User Four", "email": "user4@example.com"},
]

async def ensure_test_users(session):
    """Ensure test users exist and are verified."""
    print("Ensuring test users are created and verified...")
    users = []
    pwd_hash = hash_password("User@123")
    
    for u_data in TEST_USERS:
        result = await session.execute(select(User).where(User.phone == u_data["phone"]))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Creating new user: {u_data['phone']}")
            user = User(
                phone=u_data["phone"],
                full_name=u_data["full_name"],
                email=u_data["email"],
                password_hash=pwd_hash,
                role=UserRole.USER,
                is_active=True,
                is_verified=True # Critical requirement
            )
            session.add(user)
        else:
            print(f"Verifying existing user: {u_data['phone']}")
            user.is_verified = True
            user.is_active = True
            
        users.append(user)
    
    await session.flush()
    return users

async def seed_user_bookings():
    print("Starting booking seed process...")
    async with async_session_factory() as session:
        # 1. Ensure users
        users = await ensure_test_users(session)

        # 2. Get all venues and their courts
        venue_result = await session.execute(select(Venue))
        venues = venue_result.scalars().all()
        
        if not venues:
            print("Error: No venues found in database. Run venue seeds first.")
            return

        booking_date = date.today() + timedelta(days=1) # Book for tomorrow
        
        # 3. Create bookings for each user
        for idx, user in enumerate(users):
            # Each user books at a different venue (or cycles through them)
            venue = venues[idx % len(venues)]
            
            court_result = await session.execute(
                select(Court).where(Court.venue_id == venue.id).limit(1)
            )
            court = court_result.scalar_one_or_none()
            if not court: continue

            # Create a Booking
            booking = Booking(
                id=uuid.uuid4(),
                user_id=user.id,
                venue_id=venue.id,
                booking_date=booking_date,
                total_price=Decimal("300000"),
                status=BookingStatus.CONFIRMED,
                paid_at=datetime.utcnow()
            )
            session.add(booking)
            await session.flush()

            # Create 1-2 slots
            start_hour = 17 + (idx % 4) # Vary the times slightly
            slot = BookingSlot(
                id=uuid.uuid4(),
                booking_id=booking.id,
                court_id=court.id,
                booking_date=booking_date,
                start_time=time(start_hour, 0),
                end_time=time(start_hour + 1, 0),
                price=Decimal("300000")
            )
            session.add(slot)
            print(f"Created booking for {user.phone} at {venue.name} on {booking_date} @ {start_hour}:00")

        await session.commit()
        print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_user_bookings())
