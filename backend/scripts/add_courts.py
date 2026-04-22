
import asyncio
import os
import sys

# Add backend root to path so app can be imported
# This allows running the script from within the scripts/ folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.venue import Venue
from app.models.court import Court
from sqlalchemy import select, func

async def add_courts_to_all_venues():
    async with async_session_factory() as session:
        try:
            # Get all venues
            result = await session.execute(select(Venue))
            venues = result.scalars().all()
            
            if not venues:
                print("No venues found in database.")
                return
            
            print(f"Found {len(venues)} venues. Checking courts...")
            
            for venue in venues:
                # Count current courts
                court_count_result = await session.execute(
                    select(func.count(Court.id)).where(Court.venue_id == venue.id)
                )
                start_num = court_count_result.scalar() or 0
                
                # Add 3 courts
                for i in range(1, 4):
                    court_num = start_num + i
                    court = Court(
                        venue_id=venue.id,
                        name=f"Sân {court_num}",
                        is_active=True
                    )
                    session.add(court)
                
                print(f"Added Sân {start_num+1}-{start_num+3} to venue: {venue.name}")
            
            await session.commit()
            print("Successfully expanded all venues!")
            
        except Exception as e:
            await session.rollback()
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(add_courts_to_all_venues())
