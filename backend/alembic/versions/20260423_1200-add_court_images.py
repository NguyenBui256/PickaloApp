"""add_court_images

Revision ID: 20260423_1200
Revises: bb7e2bad3417
Create Date: 2026-04-23 12:00:00.000000+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260423_1200'
down_revision: Union[str, None] = 'bb7e2bad3417'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Add images column to courts table
    op.add_column('courts', sa.Column('images', postgresql.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    # Remove images column from courts table
    op.drop_column('courts', 'images')