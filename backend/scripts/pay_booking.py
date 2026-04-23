
import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add backend root to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.booking import Booking

async def pay_booking(booking_id_str: str):
    async with async_session_factory() as session:
        try:
            booking_id = uuid.UUID(booking_id_str)
            result = await session.get(Booking, booking_id)
            
            if not result:
                print(f"Booking with ID {booking_id_str} not found.")
                return
            
            # Update payment info
            result.paid_at = datetime.now()
            result.payment_method = "MANUAL_UPDATE"
            result.payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
            
            await session.commit()
            print(f"Successfully updated booking {booking_id_str} to PAID status.")
            print(f"Payment ID: {result.payment_id}")
            
        except Exception as e:
            await session.rollback()
            print(f"Error: {e}")

if __name__ == "__main__":
    target_id = "9f30d965-8c1d-41dc-934e-3dcedc8a1b02"
    asyncio.run(pay_booking(target_id))
