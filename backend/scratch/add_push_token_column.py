import asyncio
import os
import sys

# Thêm đường dẫn root vào python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def fix_db():
    # Thử kết nối qua cổng 5438 (Docker map)
    test_engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5438/alobo_dev')
    try:
        async with test_engine.begin() as conn:
            print("Adding expo_push_token column to users table via port 5438...")
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token VARCHAR(255)'))
        print("Successfully added expo_push_token column!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await test_engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_db())
