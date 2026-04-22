
import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.venue import Venue

async def fix_venue_data():
    async with async_session_factory() as session:
        try:
            print("Fixing venue data format (dict -> list)...")
            result = await session.execute(select(Venue))
            venues = result.scalars().all()
            
            for venue in venues:
                modified = False
                
                # Fix images
                if isinstance(venue.images, dict):
                    if "images" in venue.images:
                        venue.images = venue.images["images"]
                        modified = True
                    else:
                        # Convert other dict formats to list of keys or values
                        venue.images = list(venue.images.values()) if any(isinstance(v, str) for v in venue.images.values()) else []
                        modified = True
                
                # Fix amenities
                if isinstance(venue.amenities, dict):
                    # Convert {"parking": True, "wifi": True} -> ["Parking", "Wifi"]
                    new_amenities = [k.capitalize() for k, v in venue.amenities.items() if v]
                    venue.amenities = new_amenities
                    modified = True
                
                if modified:
                    print(f"✓ Fixed venue: {venue.name}")
                    
            await session.commit()
            print("Successfully fixed all venue data formats!")
            
        except Exception as e:
            await session.rollback()
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_venue_data())
