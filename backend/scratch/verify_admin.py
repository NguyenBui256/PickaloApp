import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import async_session_factory
from app.models import User
from app.core.security import verify_password
from sqlalchemy import select

async def verify_admin():
    async with async_session_factory() as session:
        target_phone = "+84325575098"
        result = await session.execute(select(User).filter(User.phone == target_phone))
        admin = result.scalar_one_or_none()
        
        if admin:
            is_valid = verify_password("admin", admin.password_hash)
            print(f"PASSWORD_VERIFICATION: {is_valid}")
            print(f"Hashed: {admin.password_hash}")
        else:
            print("ADMIN_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(verify_admin())
