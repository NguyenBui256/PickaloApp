import asyncio
import uuid
from datetime import date, time, timedelta, datetime
from decimal import Decimal
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.user import User
from app.models.venue import Venue
from app.models.court import Court
from app.models.booking import Booking, BookingStatus, BookingSlot

async def seed_dai_kim_bookings():
    test_phones = ["+84987654321", "+84912345678"]
    dai_kim_id = uuid.UUID("319a3deb-cbea-4fe2-bf61-ad2047ab1e31")
    
    async with async_session_factory() as session:
        # Get users
        res = await session.execute(select(User).where(User.phone.in_(test_phones)))
        users = res.scalars().all()
        
        # Get court for Dai Kim
        res = await session.execute(select(Court).where(Court.venue_id == dai_kim_id))
        court = res.scalars().first()
        
        if not court:
            print("Court for Dai Kim not found. Seed failed.")
            return

        for user in users:
            print(f"Creating Dai Kim booking for {user.phone}...")
            booking_date = date.today() + timedelta(days=5) # 5 days from now
            
            new_booking = Booking(
                id=uuid.uuid4(),
                user_id=user.id,
                venue_id=dai_kim_id,
                booking_date=booking_date,
                total_price=Decimal("300000"),
                status=BookingStatus.CONFIRMED,
                paid_at=datetime.now(),
                payment_method="TRANSFER",
                notes="Special booking for Dai Kim matchmaking test"
            )
            session.add(new_booking)
            
            slot = BookingSlot(
                id=uuid.uuid4(),
                booking_id=new_booking.id,
                court_id=court.id,
                booking_date=booking_date,
                start_time=time(19, 0),
                end_time=time(21, 0),
                price=Decimal("300000")
            )
            session.add(slot)
            
        await session.commit()
        print(f"Success: Bookings created at Dai Kim for {len(users)} users.")

if __name__ == "__main__":
    asyncio.run(seed_dai_kim_bookings())
