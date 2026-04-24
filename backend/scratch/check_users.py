import asyncio
import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.getcwd())

from app.core.database import async_session_factory
from app.services.admin import AdminService
from app.models.user import UserRole

async def check():
    async with async_session_factory() as session:
        svc = AdminService(session)
        
        print("Checking role: USER")
        users, total = await svc.list_users(role=UserRole.USER)
        print(f"Total: {total}")
        for u in users:
            print(f" - {u.full_name} ({u.phone})")
            
        print("\nChecking role: MERCHANT")
        users, total = await svc.list_users(role=UserRole.MERCHANT)
        print(f"Total: {total}")
        for u in users:
            print(f" - {u.full_name} ({u.phone})")

if __name__ == "__main__":
    asyncio.run(check())
