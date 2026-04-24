import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import async_session_factory
from app.models import User
from sqlalchemy import select

async def list_users():
    async with async_session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: '{u.phone}' | Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
