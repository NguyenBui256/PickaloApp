"""Merge heads

Revision ID: e270ad8aedee
Revises: 66fc0c9d6312, efd034cf5e40
Create Date: 2026-04-25 00:54:47.648658+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e270ad8aedee'
down_revision: Union[str, None] = ('66fc0c9d6312', 'efd034cf5e40')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    pass


def downgrade() -> None:
    """Downgrade database schema."""
    pass
