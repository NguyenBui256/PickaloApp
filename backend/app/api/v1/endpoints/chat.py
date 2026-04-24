import uuid
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from sqlalchemy.orm import selectinload
from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.chat import ChatRoom, ChatMessage
from app.schemas.chat import ChatRoomResponse, ChatMessageResponse

router = APIRouter()

# Simple Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # room_id -> list of active websocket connections
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: uuid.UUID):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: uuid.UUID):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: dict, room_id: uuid.UUID):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()


@router.get("/rooms", response_model=list[dict])
async def list_my_rooms(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all chat rooms for the current user with detailed match context and names."""
    from app.models.match import Match, MatchRequest
    from app.models.booking import Booking, BookingSlot
    from app.models.venue import Venue 
    from app.models.user import User as UserTable
    from sqlalchemy.orm import aliased
    from sqlalchemy import or_, func

    HostUser = aliased(UserTable, name="host_user")
    ReqUser = aliased(UserTable, name="req_user")

    # Select specific columns with correct attribute names from the models
    query = (
        select(
            ChatRoom.id,
            ChatRoom.match_request_id,
            ChatRoom.is_locked,
            ChatRoom.updated_at,
            ChatRoom.created_at,
            MatchRequest.status,
            ReqUser.full_name.label("requester_fullname"),
            HostUser.full_name.label("host_fullname"),
            Venue.name.label("venue_name"),
            Booking.booking_date,
            Booking.user_id.label("host_id"),
            MatchRequest.requester_id,
            func.min(BookingSlot.start_time).label("start_time") # Get the earliest slot time
        )
        .join(MatchRequest, MatchRequest.id == ChatRoom.match_request_id)
        .join(Match, Match.id == MatchRequest.match_id)
        .join(Booking, Booking.id == Match.booking_id)
        .join(BookingSlot, BookingSlot.booking_id == Booking.id) # Join with slots for time
        .join(Venue, Venue.id == Booking.venue_id)
        .join(ReqUser, ReqUser.id == MatchRequest.requester_id)
        .join(HostUser, HostUser.id == Booking.user_id)
        .where(
            or_(
                MatchRequest.requester_id == current_user.id,
                Booking.user_id == current_user.id
            )
        )
        .group_by(
            ChatRoom.id, MatchRequest.id, ReqUser.id, HostUser.id, Venue.id, Booking.id
        )
        .order_by(ChatRoom.updated_at.desc())
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    items = []
    for row in rows:
        is_host = row.host_id == current_user.id
        
        items.append({
            "id": str(row.id),
            "match_request_id": str(row.match_request_id),
            "is_locked": row.is_locked,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "other_party_name": row.requester_fullname if is_host else row.host_fullname,
            "status": row.status,
            "is_host": is_host,
            "venue_name": row.venue_name or "Sân chưa xác định",
            "match_date": str(row.booking_date) if row.booking_date else "",
            "start_time": str(row.start_time) if row.start_time else "",
        })
        
    return items


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageResponse])
async def get_room_messages(
    room_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history for a specific room."""
    # Note: In a real app, you'd check if current_user is part of this room (either requester or match owner).
    
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = list(result.scalars().all())
    # Reverse to return chronological order
    messages.reverse()
    return messages


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: uuid.UUID,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time chat.
    Expects JWT token in query parameters for auth.
    """
    try:
        # 1. Authenticate user via token
        current_user = await deps.get_current_user_from_token(token, db)
        if getattr(current_user, "target", None): 
            # Temporary workaround if get_current_user_from_token acts weird, assume logic is correct
            pass
            
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Check if room exists and is not locked
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    
    if not room:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, room_id)

    try:
        while True:
            # 3. Receive message
            data = await websocket.receive_text()
            
            # Check lock again before saving
            room_check = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
            current_room = room_check.scalar_one()
            
            if current_room.is_locked:
                await websocket.send_json({
                    "error": "This chat room is locked.",
                    "is_system": True
                })
                continue

            # 4. Save to DB
            new_msg = ChatMessage(
                room_id=room_id,
                sender_id=current_user.id,
                content=data,
                is_system_message=False
            )
            db.add(new_msg)
            await db.commit()
            await db.refresh(new_msg)

            # 5. Broadcast to room
            broadcast_data = {
                "id": str(new_msg.id),
                "room_id": str(new_msg.room_id),
                "sender_id": str(new_msg.sender_id),
                "content": new_msg.content,
                "is_system_message": new_msg.is_system_message,
                "created_at": new_msg.created_at.isoformat(),
            }
            await manager.broadcast_to_room(broadcast_data, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
