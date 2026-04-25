"""drop_incorrect_admin_actions_target_id_fkey

Revision ID: 8d55cf843ba0
Revises: e270ad8aedee
Create Date: 2026-04-25 10:55:26.249947+07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d55cf843ba0'
down_revision: Union[str, None] = 'e270ad8aedee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Drop incorrect foreign key constraint that was likely added by mistake in a manual sync
    # Use raw SQL to handle 'IF EXISTS' safely
    op.execute("ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_target_id_fkey")


def downgrade() -> None:
    """Downgrade database schema."""
    op.create_foreign_key('admin_actions_target_id_fkey', 'admin_actions', 'users', ['target_id'], ['id'])
