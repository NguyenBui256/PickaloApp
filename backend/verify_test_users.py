import asyncio
from app.core.database import async_session_factory
from sqlalchemy import select, update
from app.models.user import User

async def verify_test_users():
    phones = ["+84987654321", "+84912345678"]
    
    async with async_session_factory() as session:
        for phone in phones:
            print(f"Verifying user with phone: {phone}...")
            await session.execute(
                update(User)
                .where(User.phone == phone)
                .values(is_verified=True, is_active=True)
            )
            
        await session.commit()
        print("All test users verified successfully.")

if __name__ == "__main__":
    asyncio.run(verify_test_users())
