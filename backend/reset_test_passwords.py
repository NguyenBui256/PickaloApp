
import asyncio
import os
import sys

# Add backend root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import async_session_factory
from app.models import User
from app.core.security import hash_password
from sqlalchemy import select

async def reset_passwords():
    print("Resetting passwords for test users...")
    phones = ['+84912345678', '+84987654321', '+84843017170', '+84900111222']
    async with async_session_factory() as session:
        pwd_hash = hash_password("User@123")
        result = await session.execute(select(User).where(User.phone.in_(phones)))
        users = result.scalars().all()
        
        for user in users:
            print(f"Resetting password for: {user.phone}")
            user.password_hash = pwd_hash
            user.is_verified = True
            user.is_active = True
            
        await session.commit()
    print("Passwords reset to 'User@123' successfully!")

if __name__ == "__main__":
    asyncio.run(reset_passwords())
