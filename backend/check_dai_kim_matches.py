import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.match import Match
from app.models.booking import Booking
from app.models.venue import Venue
from app.models.user import User

async def check_dai_kim():
    dai_kim_id = "319a3deb-cbea-4fe2-bf61-ad2047ab1e31"
    async with async_session_factory() as session:
        result = await session.execute(
            select(Match, User.full_name, User.phone, Booking.booking_date)
            .join(Booking, Match.booking_id == Booking.id)
            .join(Venue, Booking.venue_id == Venue.id)
            .join(User, Booking.user_id == User.id)   # host = booking owner
            .where(Venue.id == dai_kim_id)
        )
        rows = result.all()
        print(f"{'='*70}")
        print(f"Sân Dai Kim Pickleball Complex — Tổng: {len(rows)} kèo")
        print(f"{'='*70}")
        for match, name, phone, bdate in rows:
            print(f"  Kèo ID    : {match.id}")
            print(f"  Chủ kèo   : {name} ({phone})")
            print(f"  Ngày chơi : {bdate}")
            print(f"  Trạng thái: {match.status}")
            print(f"  Slots     : cần {match.slots_needed}, đã có {match.slots_filled}, còn {match.slots_needed - match.slots_filled}")
            print(f"  Giá/người : {int(match.price_per_slot):,}đ")
            print(f"  Kỹ năng   : {match.skill_level}")
            print("-"*50)

if __name__ == "__main__":
    asyncio.run(check_dai_kim())
