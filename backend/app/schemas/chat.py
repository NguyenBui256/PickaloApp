"""
Pydantic schemas for Internal Chat.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageResponse(ChatMessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    room_id: uuid.UUID
    sender_id: uuid.UUID | None = None
    is_system_message: bool
    created_at: datetime
    
    sender: UserResponse | None = None


class ChatRoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_request_id: uuid.UUID
    is_locked: bool
    created_at: datetime
    updated_at: datetime
    
    # We might not want to include all messages by default to avoid huge responses
    messages: list[ChatMessageResponse] = []
