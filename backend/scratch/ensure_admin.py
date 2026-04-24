import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.join(os.getcwd()))

from app.core.database import async_session_factory
from app.models import User, UserRole
from app.core.security import hash_password
from sqlalchemy import select

async def ensure_admin():
    async with async_session_factory() as session:
        # Normalize phone
        target_phone = "+84325575098"
        
        # Check if admin already exists
        result = await session.execute(select(User).filter(User.phone == target_phone))
        admin = result.scalar_one_or_none()
        
        if admin:
            print(f"ADMIN_STATUS: ALREADY_EXISTS")
            print(f"Phone: {admin.phone}")
            print(f"Role: {admin.role}")
        else:
            print(f"ADMIN_STATUS: CREATING")
            new_admin = User(
                phone=target_phone,
                email="admin_dev@alobo.vn",
                password_hash=hash_password("admin"),
                full_name="System Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            session.add(new_admin)
            await session.commit()
            print(f"ADMIN_STATUS: CREATED")
            print(f"Phone: {target_phone}")
            print(f"Password: admin")

if __name__ == "__main__":
    asyncio.run(ensure_admin())
