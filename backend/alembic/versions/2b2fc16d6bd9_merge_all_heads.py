"""merge all heads

Revision ID: 2b2fc16d6bd9
Revises: 622221f708e8, b6d3f2a71c48, c8f4a1e93b27, d9e2b7c4f183, e7c1a9b45d20, ffff00000003
Create Date: 2026-08-12 11:25:20.407604

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b2fc16d6bd9'
down_revision: Union[str, Sequence[str], None] = ('622221f708e8', 'b6d3f2a71c48', 'c8f4a1e93b27', 'd9e2b7c4f183', 'e7c1a9b45d20', 'ffff00000003')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
