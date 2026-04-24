import asyncio
import uuid
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.venue import Venue
from app.models.user import User, UserRole
from app.services.admin import AdminService

async def debug_verify():
    async with SessionLocal() as session:
        # Get an admin
        admin = await session.scalar(select(User).where(User.role == UserRole.ADMIN))
        if not admin:
            print("No admin found")
            return

        # Get a venue that is not verified
        venue = await session.scalar(select(Venue).where(Venue.is_verified == False))
        if not venue:
            print("No unverified venue found")
            return

        print(f"Attempting to verify venue: {venue.name} ({venue.id})")
        print(f"Using admin: {admin.full_name} ({admin.id})")

        admin_service = AdminService(session)
        try:
            await admin_service.verify_venue(
                venue_id=venue.id,
                verified=True,
                admin=admin,
                reason="Debug verification"
            )
            print("Successfully verified venue in service")
        except Exception as e:
            print(f"Error during verification: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_verify())
