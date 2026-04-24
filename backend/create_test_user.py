import asyncio
from app.core.database import async_session_factory
from app.services.user import UserService
from app.schemas.user import UserCreate

async def create_new_test_user():
    user_in = UserCreate(
        phone="+84912345678",
        full_name="Nguyễn Văn Test",
        password="Password123"
    )
    
    async with async_session_factory() as session:
        user_service = UserService(session)
        try:
            user = await user_service.create(user_in)
            print(f"User created successfully: {user.phone} (ID: {user.id})")
        except Exception as e:
            print(f"Error creating user: {e}")

if __name__ == "__main__":
    asyncio.run(create_new_test_user())
