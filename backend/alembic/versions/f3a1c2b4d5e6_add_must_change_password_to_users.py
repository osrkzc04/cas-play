"""add must_change_password to users

Revision ID: f3a1c2b4d5e6
Revises: 55336bcf63cc
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a1c2b4d5e6'
down_revision: Union[str, Sequence[str], None] = '55336bcf63cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column(
            'must_change_password',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    # El default a nivel de servidor solo sirve para poblar filas existentes;
    # la aplicación siempre fija el valor explícitamente.
    op.alter_column('users', 'must_change_password', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'must_change_password')
