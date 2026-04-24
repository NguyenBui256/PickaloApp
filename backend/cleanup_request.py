import asyncio
import uuid
from sqlalchemy import delete
from app.core.database import async_session_factory
from app.models.match import MatchRequest
from app.models.chat import ChatRoom

async def cleanup_request():
    match_id = uuid.UUID("f0bf1f56-b15e-45b9-976a-785142bcca55")
    user_id = uuid.UUID("c2649ffe-6f18-4e92-b6d7-549590c89511")
    
    async with async_session_factory() as session:
        # Find the request ID to delete associated chat rooms too
        from sqlalchemy import select
        res = await session.execute(
            select(MatchRequest).where(
                MatchRequest.match_id == match_id, 
                MatchRequest.requester_id == user_id
            )
        )
        reqs = res.scalars().all()
        
        for req in reqs:
            print(f"Deleting request {req.id} and its chat rooms...")
            # Delete chat rooms first due to foreign key
            await session.execute(delete(ChatRoom).where(ChatRoom.match_request_id == req.id))
            # Delete request
            await session.execute(delete(MatchRequest).where(MatchRequest.id == req.id))
            
        await session.commit()
        print("Cleanup completed successfully.")

if __name__ == "__main__":
    asyncio.run(cleanup_request())
