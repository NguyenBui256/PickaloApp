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

async def seed_extra_bookings():
    test_phones = ["+84987654321", "+84912345678"] # Using the verified ones we know
    
    async with async_session_factory() as session:
        # Get users
        res = await session.execute(select(User).where(User.phone.in_(test_phones)))
        users = res.scalars().all()
        
        # Get venues and their courts
        res = await session.execute(select(Venue).limit(2))
        venues = res.scalars().all()
        
        if not users or not venues:
            print("Missing users or venues. Seed failed.")
            return

        for user in users:
            print(f"Creating bookings for {user.phone}...")
            for i in range(3): # 3 bookings per user
                venue = venues[i % len(venues)]
                # Get a court for this venue
                res = await session.execute(select(Court).where(Court.venue_id == venue.id))
                court = res.scalars().first()
                if not court: continue
                
                booking_date = date.today() + timedelta(days=i+1)
                
                # Create Booking
                new_booking = Booking(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    venue_id=venue.id,
                    booking_date=booking_date,
                    total_price=Decimal("200000"),
                    status=BookingStatus.CONFIRMED,
                    paid_at=datetime.now(),
                    payment_method="CASH",
                    notes=f"Test booking {i+1} for matchmaking"
                )
                session.add(new_booking)
                
                # Create Slot
                slot = BookingSlot(
                    id=uuid.uuid4(),
                    booking_id=new_booking.id,
                    court_id=court.id,
                    booking_date=booking_date,
                    start_time=time(17+i, 0),
                    end_time=time(18+i, 0),
                    price=Decimal("200000")
                )
                session.add(slot)
                
        await session.commit()
        print("Success: Extra bookings created.")

if __name__ == "__main__":
    asyncio.run(seed_extra_bookings())
