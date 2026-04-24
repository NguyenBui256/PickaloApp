import asyncio
from sqlalchemy import select, and_, exists
from app.db.session import async_session_factory
from app.models.match import MatchRequest, Match, MatchRequestStatus
from app.models.booking import Booking, BookingSlot

async def test():
    async with async_session_factory() as session:
        # Just compile the query to see if it raises an error
        q = select(exists().where(
            and_(
                MatchRequest.requester_id == "f0842e2a-1ce6-4256-a111-bdc2fca5d038",
                MatchRequest.status.in_([MatchRequestStatus.PENDING, MatchRequestStatus.ACCEPTED]),
                Match.id == MatchRequest.match_id,
                Booking.id == Match.booking_id,
                BookingSlot.booking_id == Booking.id,
            )
        ))
        try:
            res = await session.execute(q)
            print("Query executed successfully, result:", res.scalar())
        except Exception as e:
            print("ERROR executing query:", type(e))
            print(e)
        
        # Test the other query too
        q2 = select(exists().where(
            and_(
                Booking.user_id == "f0842e2a-1ce6-4256-a111-bdc2fca5d038",
                BookingSlot.booking_id == Booking.id,
            )
        ))
        try:
            res2 = await session.execute(q2)
            print("Query 2 executed successfully, result:", res2.scalar())
        except Exception as e:
            print("ERROR executing query 2:", type(e))
            print(e)

if __name__ == "__main__":
    asyncio.run(test())
