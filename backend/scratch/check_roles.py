import asyncio
import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from app.core.database import async_session_factory
from sqlalchemy import select
from app.models.user import User

async def check():
    async with async_session_factory() as session:
        print("Checking all users roles...")
        res = await session.execute(select(User.phone, User.role))
        rows = res.all()
        for p, r in rows:
            print(f"Phone: {p}, Role: {r}, Type: {type(r)}")

if __name__ == "__main__":
    asyncio.run(check())
