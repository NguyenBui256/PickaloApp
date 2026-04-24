"""
Matchmaking business logic service.

Handles creation of matches, seeking matches nearby,
and managing join requests (accept/reject).
"""

import uuid
from decimal import Decimal
from typing import Any
from datetime import time, date

from sqlalchemy import select, and_, exists
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import functions as geofunc, Geography, Geometry
from sqlalchemy import cast, func, literal

from app.models.match import Match, MatchStatus, MatchSkillLevel, MatchRequest, MatchRequestStatus
from app.models.chat import ChatRoom, ChatMessage
from app.models.booking import Booking, BookingStatus, BookingSlot
from app.models.venue import Venue


class MatchService:
    """Service for matchmaking operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_match(
        self,
        booking_id: uuid.UUID,
        slots_needed: int,
        price_per_slot: Decimal,
        skill_level: MatchSkillLevel,
        note: str | None,
        owner_id: uuid.UUID
    ) -> Match:
        """Create a public match from a booking."""
        # 1. Verify booking exists and belongs to owner
        result = await self.session.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()
        
        if not booking:
            raise ValueError("Booking not found")
            
        if booking.user_id != owner_id:
            raise ValueError("Only the booking owner can make it public")
            
        if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
            raise ValueError("Booking must be active to create a match")

        # 2. Check if match already exists
        exist_result = await self.session.execute(
            select(Match).where(Match.booking_id == booking_id)
        )
        if exist_result.scalar_one_or_none():
            raise ValueError("Match already exists for this booking")

        # 3. Create match
        match = Match(
            booking_id=booking_id,
            slots_needed=slots_needed,
            price_per_slot=price_per_slot,
            skill_level=skill_level,
            note=note,
            status=MatchStatus.OPEN
        )
        
        self.session.add(match)
        await self.session.flush()
        
        # Reload relationships
        await self.session.refresh(match, ["booking"])
        return match

    async def get_match(self, match_id: uuid.UUID) -> Match | None:
        """Get match details."""
        result = await self.session.execute(
            select(Match).where(Match.id == match_id)
        )
        return result.scalar_one_or_none()

    async def search_nearby_matches(
        self,
        lat: float,
        lng: float,
        radius: float = 5000,
        skill_level: MatchSkillLevel | None = None,
        min_slots: int | None = None,
        date: date | None = None,
        start_time: time | None = None,
        end_time: time | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Any], int]:
        """
        Search for OPEN matches nearby using PostGIS.
        Returns tuples of (Match, lat, lng, distance).
        """
        # Center point
        point = cast(geofunc.ST_SetSRID(geofunc.ST_MakePoint(lng, lat), 4326), Geography)

        conditions = [
            Match.status == MatchStatus.OPEN,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            geofunc.ST_DWithin(Venue.location, point, radius)
        ]

        if skill_level and skill_level != MatchSkillLevel.ALL:
            conditions.append(Match.skill_level == skill_level)

        if min_slots is not None:
            conditions.append((Match.slots_needed - Match.slots_filled) >= min_slots)

        if date is not None:
            conditions.append(Booking.booking_date == date)

        if start_time is not None:
            # Check if any slot in the booking starts at or after start_time
            conditions.append(exists().where(
                and_(
                    BookingSlot.booking_id == Match.booking_id,
                    BookingSlot.start_time >= start_time
                )
            ))

        if end_time is not None:
            # Check if any slot in the booking ends at or before end_time
            conditions.append(exists().where(
                and_(
                    BookingSlot.booking_id == Match.booking_id,
                    BookingSlot.end_time <= end_time
                )
            ))

        # Base query joins Match -> Booking -> Venue
        query = select(
            Match,
            func.ST_Y(cast(Venue.location, Geometry)).label("lat"),
            func.ST_X(cast(Venue.location, Geometry)).label("lng"),
            geofunc.ST_Distance(Venue.location, point).label("distance"),
            Venue.name.label("venue_name"),
            Venue.address.label("venue_address")
        ).join(
            Booking, Booking.id == Match.booking_id
        ).join(
            Venue, Venue.id == Booking.venue_id
        ).options(
            selectinload(Match.booking).selectinload(Booking.slots),
            selectinload(Match.booking).selectinload(Booking.user),
            selectinload(Match.booking).selectinload(Booking.venue)
        ).where(and_(*conditions))
        
        # Count query
        count_query = select(func.count()).select_from(Match).join(
            Booking, Booking.id == Match.booking_id
        ).join(
            Venue, Venue.id == Booking.venue_id
        ).where(and_(*conditions))

        # Execute count
        count_result = await self.session.execute(count_query)
        total = count_result.scalar() or 0

        # Execute paginated results
        result = await self.session.execute(
            query
            .order_by(geofunc.ST_Distance(Venue.location, point).asc())
            .offset(skip)
            .limit(limit)
        )
        
        matches = list(result.all())
        return matches, total

    async def create_request(
        self,
        match_id: uuid.UUID,
        requester_id: uuid.UUID,
        member_count: int,
        initial_message: str | None = None
    ) -> MatchRequest:
        """Create a request to join a match, checking slot availability."""
        match = await self.get_match(match_id)
        if not match:
            raise ValueError("Match not found")
            
        if match.status != MatchStatus.OPEN:
            raise ValueError("Match is no longer open")
            
        # Prevent owner from requesting their own match
        booking_res = await self.session.execute(select(Booking).where(Booking.id == match.booking_id))
        booking = booking_res.scalar_one()
        
        print(f"DEBUG: create_request - requester_id: {requester_id}")
        print(f"DEBUG: create_request - match_owner_id: {booking.user_id}")
        
        if booking.user_id == requester_id:
            print("DEBUG: create_request - FAILED: Cannot join own match")
            raise ValueError("You cannot request to join your own match")

        print(f"DEBUG: create_request - available_slots: {match.available_slots}, requested: {member_count}")
        if member_count > match.available_slots:
            print("DEBUG: create_request - FAILED: Not enough slots")
            raise ValueError(f"Only {match.available_slots} slots available, cannot take {member_count}")
            
        # Check if already requested
        exist_req = await self.session.execute(
            select(MatchRequest).where(
                and_(MatchRequest.match_id == match_id, MatchRequest.requester_id == requester_id)
            )
        )
        if exist_req.scalar_one_or_none():
            print("DEBUG: create_request - FAILED: Already requested")
            raise ValueError("You have already requested to join this match")

        # 1. Create Match Request
        req = MatchRequest(
            match_id=match_id,
            requester_id=requester_id,
            member_count=member_count,
            status=MatchRequestStatus.PENDING
        )
        self.session.add(req)
        await self.session.flush() # flush to get req.id

        # 2. Automatically create a Chat Room
        chat_room = ChatRoom(
            match_request_id=req.id,
            is_locked=False
        )
        self.session.add(chat_room)
        await self.session.flush() # flush to get chat_room.id

        # 3. Add initial message if provided
        if initial_message:
            msg = ChatMessage(
                room_id=chat_room.id,
                sender_id=requester_id,
                content=initial_message,
                is_system_message=False
            )
            self.session.add(msg)
            
        await self.session.commit()
        
        # Fetch the created request with its relationships pre-loaded to avoid lazy load errors
        final_query = select(MatchRequest).where(MatchRequest.id == req.id).options(
            selectinload(MatchRequest.requester),
            selectinload(MatchRequest.chat_room)
        )
        res = await self.session.execute(final_query)
        return res.scalar_one()

    async def respond_to_request(
        self,
        request_id: uuid.UUID,
        owner_id: uuid.UUID,
        accept: bool
    ) -> MatchRequest:
        """Host accepts or rejects a match request."""
        # Get request with match and booking
        result = await self.session.execute(
            select(MatchRequest)
            .join(Match)
            .join(Booking)
            .where(MatchRequest.id == request_id)
        )
        req = result.scalar_one_or_none()
        
        if not req:
            raise ValueError("Request not found")
            
        # Refresh match & booking independently if needed to ensure we have access,
        # but joining them in query already loaded them in identity map.
        match_result = await self.session.execute(select(Match).where(Match.id == req.match_id))
        match = match_result.scalar_one()
        
        booking_result = await self.session.execute(select(Booking).where(Booking.id == match.booking_id))
        booking = booking_result.scalar_one()
        
        if booking.user_id != owner_id:
            raise ValueError("Only match owner can respond to requests")
            
        if req.status != MatchRequestStatus.PENDING:
            raise ValueError("Request is already processed")
            
        if accept:
            # Check slots again just in case
            if req.member_count > match.available_slots:
                raise ValueError("Not enough slots available anymore")
                
            req.status = MatchRequestStatus.ACCEPTED
            match.slots_filled += req.member_count
            
            if match.slots_filled >= match.slots_needed:
                match.status = MatchStatus.FULL
        else:
            req.status = MatchRequestStatus.REJECTED
            
            # Find chat room and lock it
            room_res = await self.session.execute(
                select(ChatRoom).where(ChatRoom.match_request_id == req.id)
            )
            room = room_res.scalar_one_or_none()
            if room:
                room.is_locked = True
                # Send system message
                sys_msg = ChatMessage(
                    room_id=room.id,
                    sender_id=None,
                    content="Chủ kèo đã từ chối yêu cầu tham gia.",
                    is_system_message=True
                )
                self.session.add(sys_msg)

        await self.session.commit()
        await self.session.refresh(req)
        return req
