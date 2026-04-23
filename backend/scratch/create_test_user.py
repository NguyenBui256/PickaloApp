import asyncio
from app.core.database import async_session_factory
from app.services.auth import AuthService
from app.models.user import UserRole
import uuid

async def create_test_user():
    async with async_session_factory() as session:
        auth_service = AuthService(session)
        try:
            user = await auth_service.create_user(
                phone="+84000000001",
                password="Password123",
                full_name="Test User",
                role=UserRole.USER
            )
            await session.commit()
            print("User created: +84000000001 / Password123")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_test_user())
