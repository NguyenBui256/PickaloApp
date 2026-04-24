"""add payment_proof to bookings

Revision ID: efd034cf5e40
Revises: 1852010b34c4
Create Date: 2026-04-24 21:46:26.242369+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'efd034cf5e40'
down_revision: Union[str, None] = '1852010b34c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.add_column('bookings', sa.Column('payment_proof', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade database schema."""
    op.drop_column('bookings', 'payment_proof')
