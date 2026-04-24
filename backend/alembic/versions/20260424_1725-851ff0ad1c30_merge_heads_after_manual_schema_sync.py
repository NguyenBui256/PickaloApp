"""Merge heads after manual schema sync

Revision ID: 851ff0ad1c30
Revises: 58a981ca9001, 464691fad0c5
Create Date: 2026-04-24 17:25:24.483317+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '851ff0ad1c30'
down_revision: Union[str, None] = ('58a981ca9001', '464691fad0c5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    pass


def downgrade() -> None:
    """Downgrade database schema."""
    pass
