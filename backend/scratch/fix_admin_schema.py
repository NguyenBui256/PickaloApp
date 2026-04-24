import asyncio
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Database URL for local host access (using mapped port 5438)
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5438/alobo_dev"

async def fix_schema():
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Checking for legacy foreign key constraints on admin_actions.target_id...")
        
        # Check if the constraint exists
        query = text("""
            SELECT constraint_name 
            FROM information_schema.key_column_usage 
            WHERE table_name = 'admin_actions' AND column_name = 'target_id'
        """)
        result = await conn.execute(query)
        constraints = result.fetchall()
        
        if constraints:
            for row in constraints:
                constraint_name = row[0]
                print(f"Found constraint: {constraint_name}. Dropping it...")
                await conn.execute(text(f"ALTER TABLE admin_actions DROP CONSTRAINT \"{constraint_name}\""))
                print(f"Constraint {constraint_name} dropped successfully.")
        else:
            print("No constraints found on admin_actions.target_id.")
            
    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(fix_schema())
    except Exception as e:
        print(f"Error: {e}")
