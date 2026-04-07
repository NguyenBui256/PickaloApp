"""
Base model with common fields for all database models.

Provides:
- UUID primary key
- created_at and updated_at timestamps
- deleted_at for soft deletes
- Automatic updated_at timestamp updates
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    """

    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Generate table name from class name (camelCase to snake_case)."""
        name = cls.__name__
        # Convert CamelCase to snake_case
        result = [name[0].lower()]
        for char in name[1:]:
            if char.isupper():
                result.extend(["_", char.lower()])
            else:
                result.append(char)
        return "".join(result) + "s"

    def __repr__(self) -> str:
        """String representation for debugging."""
        class_name = self.__class__.__name__
        attrs = []
        for key in ["id", "name", "email", "phone", "title"]:
            if hasattr(self, key):
                value = getattr(self, key)
                if value is not None:
                    attrs.append(f"{key}={value!r}")
        if not attrs:
            attrs.append(f"id={self.id}")
        return f"{class_name}({', '.join(attrs)})"


class TimestampMixin:
    """
    Mixin providing timestamp fields for tracking creation and modification times.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Mixin providing soft delete functionality.
    Records when an entity was deleted instead of actually removing it.
    """

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
        nullable=True,
        index=True,
    )

    @property
    def is_deleted(self) -> bool:
        """Check if this entity has been soft deleted."""
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """Mark this entity as deleted."""
        self.deleted_at = datetime.now()

    def restore(self) -> None:
        """Restore this soft-deleted entity."""
        self.deleted_at = None


class BaseModel(Base, TimestampMixin, SoftDeleteMixin):
    """
    Base model class combining common mixins.
    All models should inherit from this class.
    """

    __abstract__ = True

    # UUID primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    def to_dict(self) -> dict[str, Any]:
        """
        Convert model to dictionary representation.
        Useful for JSON serialization.
        """
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif isinstance(value, uuid.UUID):
                value = str(value)
            result[column.name] = value
        return result
