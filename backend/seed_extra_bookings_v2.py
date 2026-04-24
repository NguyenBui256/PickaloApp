import asyncio
import uuid
from datetime import date, time, timedelta, datetime
from decimal import Decimal
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.user import User, UserRole
from app.models.venue import Venue
from app.models.court import Court
from app.models.booking import Booking, BookingStatus, BookingSlot
from app.core.security import hash_password

async def seed_extra_bookings():
    test_phones = ["+84987654321", "+84912345678", "+840000000001"]
    
    async with async_session_factory() as session:
        target_users = []
        for phone in test_phones:
            res = await session.execute(select(User).where(User.phone == phone))
            user = res.scalar_one_or_none()
            if not user:
                print(f"Creating missing user: {phone}...")
                user = User(
                    phone=phone,
                    password_hash=hash_password("Password123"),
                    full_name=f"User {phone[-4:]}",
                    role=UserRole.USER,
                    is_active=True,
                    is_verified=True
                )
                session.add(user)
                await session.flush()
            target_users.append(user)
            
        # Get venues and their courts
        res = await session.execute(select(Venue).limit(3))
        venues = res.scalars().all()
        
        if not venues:
            print("No venues found. Seed failed.")
            return

        for user in target_users:
            print(f"Creating 3 bookings for {user.phone}...")
            for i in range(3):
                venue = venues[i % len(venues)]
                res = await session.execute(select(Court).where(Court.venue_id == venue.id))
                court = res.scalars().first()
                if not court: continue
                
                booking_date = date.today() + timedelta(days=i+1)
                
                new_booking = Booking(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    venue_id=venue.id,
                    booking_date=booking_date,
                    total_price=Decimal("250000"),
                    status=BookingStatus.CONFIRMED,
                    paid_at=datetime.now(),
                    payment_method="CASH",
                    notes=f"Matchmaking test booking {i+1}"
                )
                session.add(new_booking)
                
                slot = BookingSlot(
                    id=uuid.uuid4(),
                    booking_id=new_booking.id,
                    court_id=court.id,
                    booking_date=booking_date,
                    start_time=time(18, 0),
                    end_time=time(20, 0),
                    price=Decimal("250000")
                )
                session.add(slot)
                
        await session.commit()
        print("Success: 9 extra bookings created across 3 users.")

if __name__ == "__main__":
    asyncio.run(seed_extra_bookings())
