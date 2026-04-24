import asyncio
from app.core.database import async_session_factory
from app.services.auth import AuthService
from app.models.user import UserRole

async def create_new_test_user():
    phone = "+84912345678"
    full_name = "Nguyễn Văn Test"
    password = "Password123"
    
    async with async_session_factory() as session:
        auth_service = AuthService(session)
        try:
            user = await auth_service.create_user(
                phone=phone,
                password=password,
                full_name=full_name,
                role=UserRole.USER
            )
            await session.commit()
            print(f"User created successfully: {user.phone} (ID: {user.id})")
        except ValueError as e:
            print(f"Validation error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(create_new_test_user())
