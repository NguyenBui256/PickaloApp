import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.venue import Venue

async def list_all_venues():
    async with async_session_factory() as session:
        result = await session.execute(select(Venue))
        venues = result.scalars().all()
        print(f"{'NAME':<30} | {'ID':<38} | {'ADDRESS'}")
        print("-" * 100)
        for v in venues:
            print(f"{v.name[:30]:<30} | {str(v.id):<38} | {v.address}")

if __name__ == "__main__":
    asyncio.run(list_all_venues())
