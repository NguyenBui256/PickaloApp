import asyncio
import uuid
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.services.admin import AdminService
from app.schemas.admin import UserListItem

async def debug_list_users():
    async with SessionLocal() as session:
        admin_service = AdminService(session)
        print("Attempting to list users...")
        try:
            users, total = await admin_service.list_users(role=UserRole.USER)
            print(f"Service returned {len(users)} users, total {total}")
            
            print("Attempting to validate first user with schema...")
            if users:
                u = users[0]
                item = UserListItem.model_validate(u)
                print(f"Validated user: {item.full_name}, venues: {item.venues_count}")
            else:
                print("No users found to validate")
                
        except Exception as e:
            print(f"Error: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_list_users())
