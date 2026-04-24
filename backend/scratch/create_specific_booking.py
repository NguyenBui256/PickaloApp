import asyncio
import uuid
from datetime import date, time, datetime
from decimal import Decimal
from app.core.database import async_session_factory
from app.models.venue import Venue
from app.models.user import User
from app.models.court import Court
from app.models.booking import Booking, BookingSlot, BookingStatus
from sqlalchemy import select

async def create_specific_booking():
    async with async_session_factory() as db:
        # 1. Find Venue
        v_result = await db.execute(select(Venue).where(Venue.name.ilike('%Dai Kim%')))
        venue = v_result.scalar_one_or_none()
        if not venue:
            print("Dai Kim Pickleball Complex not found!")
            return

        # 2. Find User
        u_result = await db.execute(select(User).where(User.phone == '+84843017170'))
        user = u_result.scalar_one_or_none()
        if not user:
            print("User +84843017170 not found!")
            return

        # 3. Get first court
        c_result = await db.execute(select(Court).where(Court.venue_id == venue.id))
        court = c_result.scalars().first()
        if not court:
            print("No courts found for this venue!")
            return

        print(f"Creating booking for {user.full_name} at {venue.name} - {court.name}")

        # 4. Create Booking
        booking = Booking(
            id=uuid.uuid4(),
            user_id=user.id,
            venue_id=venue.id,
            booking_date=date(2026, 4, 29),
            total_price=Decimal("300000.00"),
            status=BookingStatus.CONFIRMED,
            paid_at=datetime.now(),
            payment_method="CASH",
            notes="Đặt hộ từ hệ thống",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(booking)
        await db.flush()

        # 5. Create Slot
        slot = BookingSlot(
            id=uuid.uuid4(),
            booking_id=booking.id,
            court_id=court.id,
            booking_date=date(2026, 4, 29),
            start_time=time(19, 0),
            end_time=time(21, 0),
            price=Decimal("300000.00")
        )
        db.add(slot)

        await db.commit()
        print(f"Successfully created Booking ID: {booking.id}")

if __name__ == "__main__":
    asyncio.run(create_specific_booking())
