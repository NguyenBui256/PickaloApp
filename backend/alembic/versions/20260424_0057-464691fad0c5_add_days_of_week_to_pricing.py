"""add_days_of_week_to_pricing

Revision ID: 464691fad0c5
Revises: db46c628336e
Create Date: 2026-04-24 00:57:44.980774+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '464691fad0c5'
down_revision: Union[str, None] = 'db46c628336e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column('pricing_profile_slots', sa.Column('days_of_week', sa.JSON(), nullable=True))
    op.add_column('pricing_time_slots', sa.Column('days_of_week', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column('pricing_time_slots', 'days_of_week')
    op.drop_column('pricing_profile_slots', 'days_of_week')
