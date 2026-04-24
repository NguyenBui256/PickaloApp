"""
Chat models for internal matchmaking communication.

Includes:
- ChatRoom: A chat session tied to a MatchRequest
- ChatMessage: Individual messages within a room
"""

import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.match import MatchRequest
    from app.models.user import User


class ChatRoom(BaseModel):
    """
    A 1-on-1 chat room between a Match Owner and a Requester.
    """

    __tablename__ = "chat_rooms"

    match_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("match_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hidden_for_host: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hidden_for_requester: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    match_request: Mapped["MatchRequest"] = relationship(
        "MatchRequest", back_populates="chat_room"
    )
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="room", cascade="all, delete-orphan", lazy="selectin"
    )


class ChatMessage(BaseModel):
    """
    A message sent within a ChatRoom.
    """

    __tablename__ = "chat_messages"

    room_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # sender_id can be null if it's a system message
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_system_message: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    room: Mapped["ChatRoom"] = relationship(
        "ChatRoom", back_populates="messages"
    )
    sender: Mapped["User"] = relationship(
        "User", lazy="selectin"
    )
