
import asyncio
import os
import sys

# Add current directory to path so app can be imported
sys.path.append(os.getcwd())

from app.core.database import async_session_factory
from sqlalchemy import text

async def clear_all_bookings():
    async with async_session_factory() as session:
        try:
            print("Cleaning up all booking data...")
            
            # Use raw SQL for speed and to handle complex relationships simply
            # The order must respect foreign key constraints
            await session.execute(text("DELETE FROM booking_services"))
            await session.execute(text("DELETE FROM booking_slots"))
            await session.execute(text("DELETE FROM bookings"))
            
            await session.commit()
            print("Successfully cleared all bookings! All slots are now available.")
            
        except Exception as e:
            await session.rollback()
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(clear_all_bookings())
