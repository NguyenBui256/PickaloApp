
import asyncio
import os
import sys

# Add backend root to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.venue import PricingTimeSlot
from sqlalchemy import select

async def check_pricing():
    async with async_session_factory() as session:
        try:
            result = await session.execute(select(PricingTimeSlot))
            slots = result.scalars().all()
            if not slots:
                print("No pricing slots found in database. Using system defaults.")
                return
                
            print(f"Found {len(slots)} pricing slots in database:")
            for s in slots:
                print(f"Venue: {s.venue_id} | Day: {s.day_type} | Time: {s.start_time.strftime('%H:%M')}-{s.end_time.strftime('%H:%M')} | Factor: {s.price_factor}")
        except Exception as e:
            print(f"Error querying database: {e}")

if __name__ == "__main__":
    asyncio.run(check_pricing())
