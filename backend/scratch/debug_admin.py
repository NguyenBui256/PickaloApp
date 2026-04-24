import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import async_session_factory
from app.models import User
from sqlalchemy import select

async def debug_admin():
    async with async_session_factory() as session:
        target_phone = "+84325575098"
        result = await session.execute(select(User).filter(User.phone == target_phone))
        admin = result.scalar_one_or_none()
        
        if admin:
            print(f"Phone: '{admin.phone}'")
            print(f"Deleted At: {admin.deleted_at}")
            print(f"Is Active: {admin.is_active}")
        else:
            print("ADMIN_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(debug_admin())
