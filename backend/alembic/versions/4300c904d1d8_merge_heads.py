"""merge heads

Revision ID: 4300c904d1d8
Revises: 366aca8c8494, a1b2c3d4e5f8, voice_intro_url_001, ffff00000004
Create Date: 2026-08-16 09:12:11.830497

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4300c904d1d8'
down_revision: Union[str, Sequence[str], None] = ('366aca8c8494', 'a1b2c3d4e5f8', 'voice_intro_url_001', 'ffff00000004')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
