import asyncio
import os
import sys

# Thêm đường dẫn root vào python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def check():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5438/alobo_dev')
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT id, phone, role, expo_push_token FROM users WHERE expo_push_token IS NOT NULL"))
            rows = result.fetchall()
            print('\n--- USERS WITH PUSH TOKENS ---')
            if not rows:
                print("No tokens found in database.")
            for r in rows:
                print(f"ID: {r[0]} | Phone: {r[1]} | Role: {r[2]} | Token: {r[3][:20]}...")
            print('-------------------------------\n')
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
