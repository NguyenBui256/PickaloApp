"""add logo and booking_link to venues

Revision ID: 1852010b34c4
Revises: 35ae334e66b3
Create Date: 2026-04-24 21:37:27.797946+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1852010b34c4'
down_revision: Union[str, None] = '35ae334e66b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column('venues', sa.Column('logo', sa.String(length=500), nullable=True))
    op.add_column('venues', sa.Column('booking_link', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column('venues', 'booking_link')
    op.drop_column('venues', 'logo')
