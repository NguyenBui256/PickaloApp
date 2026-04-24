"""add_cover_image_to_venue

Revision ID: 35ae334e66b3
Revises: 851ff0ad1c30
Create Date: 2026-04-24 17:39:40.073013+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35ae334e66b3'
down_revision: Union[str, None] = '851ff0ad1c30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column('venues', sa.Column('cover_image', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column('venues', 'cover_image')
