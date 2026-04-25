"""
Newsfeed and community post models.

Includes:
- Post: Community posts for finding teammates, recruiting, social
- Comment: Comments on posts
"""

import uuid
from datetime import date, time
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Integer, Date, Time, ForeignKey, JSON, Enum as sqlalchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.venue import Venue


class PostType(str, Enum):
    """Types of posts in the community feed."""

    RECRUITING = "RECRUITING"  # Looking for players to join a team
    LOOKING_FOR_TEAM = "LOOKING_FOR_TEAM"  # Player looking for a team
    SOCIAL = "SOCIAL"  # General sports community posts


class PostStatus(str, Enum):
    """Post status for visibility control."""

    ACTIVE = "ACTIVE"  # Visible in feed
    CLOSED = "CLOSED"  # No longer accepting responses
    HIDDEN = "HIDDEN"  # Hidden by user or admin


class SportType(str, Enum):
    """Sport types for filtering posts."""

    FOOTBALL = "Football"
    TENNIS = "Tennis"
    BADMINTON = "Badminton"
    BASKETBALL = "Basketball"
    VOLLEYBALL = "Volleyball"
    SWIMMING = "Swimming"
    TABLE_TENNIS = "Table Tennis"
    RUNNING = "Running"
    OTHER = "Other"


class Post(BaseModel):
    """
    Community post for finding teammates and organizing games.

    Attributes:
        user_id: Author of the post
        post_type: Category of post (recruiting, looking, social)
        sport_type: Sport filter
        title: Post headline
        content: Post body text
        venue_id: Optional linked venue
        venue_name: Denormalized venue name for search
        district: Hanoi district filter
        event_date: When the game/event is happening
        event_time: Time of the event
        player_count_needed: How many players needed
        images: Array of image URLs
        status: Post visibility status
    """

    # Author
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    post_type: Mapped[PostType] = mapped_column(
        sqlalchemyEnum(PostType, native_enum=False),
        nullable=False,
    )
    sport_type: Mapped[SportType | None] = mapped_column(
        sqlalchemyEnum(SportType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        index=True,
    )

    # Content
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Location context
    venue_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("venues.id", ondelete="SET NULL"),
        nullable=True,
    )
    venue_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    district: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    # Event details
    event_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    event_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )
    player_count_needed: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Media
    images: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    status: Mapped[PostStatus] = mapped_column(
        sqlalchemyEnum(PostStatus, native_enum=False),
        default=PostStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    # Relationships
    author: Mapped["User"] = relationship(
        "User",
        back_populates="posts",
        lazy="selectin",
    )
    venue: Mapped["Venue | None"] = relationship(
        "Venue",
        lazy="selectin",
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="post",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    @property
    def is_active(self) -> bool:
        """Check if post is currently active."""
        return self.status == PostStatus.ACTIVE

    @property
    def is_recruiting(self) -> bool:
        """Check if this is a recruiting post."""
        return self.post_type == PostType.RECRUITING

    @property
    def is_looking_for_team(self) -> bool:
        """Check if this is a looking-for-team post."""
        return self.post_type == PostType.LOOKING_FOR_TEAM

    def close(self) -> None:
        """Close the post (no longer accepting responses)."""
        self.status = PostStatus.CLOSED

    def hide(self) -> None:
        """Hide the post from the feed."""
        self.status = PostStatus.HIDDEN

    def __repr__(self) -> str:
        """String representation for debugging."""
        return (
            f"Post(id={self.id!r}, type={self.post_type.value}, "
            f"sport={self.sport_type.value if self.sport_type else None})"
        )


class Comment(BaseModel):
    """
    Comment on a community post.

    Attributes:
        post_id: Post being commented on
        user_id: Comment author
        content: Comment text
    """

    __tablename__ = "comments"

    # Relationships
    post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Content
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Relationships
    post: Mapped["Post"] = relationship(
        "Post",
        back_populates="comments",
        lazy="selectin",
    )
    author: Mapped["User"] = relationship(
        "User",
        back_populates="comments",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"Comment(id={self.id!r}, post_id={self.post_id!r}, user_id={self.user_id!r})"
