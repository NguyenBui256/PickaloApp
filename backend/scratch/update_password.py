import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import async_session_factory
from app.models import User
from app.core.security import hash_password
from sqlalchemy import select

async def update_password():
    async with async_session_factory() as session:
        target_phone = "+84325575098"
        result = await session.execute(select(User).filter(User.phone == target_phone))
        admin = result.scalar_one_or_none()
        
        if admin:
            admin.password_hash = hash_password("1")
            await session.commit()
            print("PASSWORD_UPDATED: TRUE")
        else:
            print("ADMIN_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(update_password())
