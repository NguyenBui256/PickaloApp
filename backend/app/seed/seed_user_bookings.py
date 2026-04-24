
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
from app.models import User, Venue, Court, Booking, BookingSlot
from app.models.booking import BookingStatus

async def seed_user_bookings():
    print("Starting booking seed for +84987654321...")
    async with async_session_factory() as session:
        # 1. Find the target user
        user_result = await session.execute(
            select(User).where(User.phone == "+84987654321")
        )
        user = user_result.scalar_one_or_none()
        if not user:
            print("Error: User +84987654321 not found. Please register first.")
            return

        # 2. Get some venues and courts
        venue_result = await session.execute(select(Venue).limit(2))
        venues = venue_result.scalars().all()
        
        if not venues:
            print("Error: No venues found in database. Run venue seeds first.")
            return

        booking_date = date.today() + timedelta(days=1) # Book for tomorrow
        
        for i, venue in enumerate(venues):
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
                total_price=Decimal("400000"),
                status=BookingStatus.CONFIRMED,
                paid_at=datetime.utcnow()
            )
            session.add(booking)
            await session.flush()

            # Create 2 slots (2 hours)
            slot1 = BookingSlot(
                id=uuid.uuid4(),
                booking_id=booking.id,
                court_id=court.id,
                booking_date=booking_date,
                start_time=time(17 + i, 0),
                end_time=time(18 + i, 0),
                price=Decimal("200000")
            )
            slot2 = BookingSlot(
                id=uuid.uuid4(),
                booking_id=booking.id,
                court_id=court.id,
                booking_date=booking_date,
                start_time=time(18 + i, 0),
                end_time=time(19 + i, 0),
                price=Decimal("200000")
            )
            session.add_all([slot1, slot2])
            print(f"Created booking for {user.phone} at {venue.name} on {booking_date}")

        await session.commit()
        print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_user_bookings())
