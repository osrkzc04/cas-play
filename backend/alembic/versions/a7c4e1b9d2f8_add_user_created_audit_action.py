"""add USER_CREATED to audit_action enum

Revision ID: a7c4e1b9d2f8
Revises: f3a1c2b4d5e6
Create Date: 2026-06-17 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a7c4e1b9d2f8'
down_revision: Union[str, Sequence[str], None] = 'f3a1c2b4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ALTER TYPE ... ADD VALUE no puede ejecutarse dentro del bloque
    # transaccional de la migración; autocommit_block lo aísla.
    with op.get_context().autocommit_block():
        op.execute(
            "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'USER_CREATED'"
        )


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL no admite eliminar valores de un tipo enum; no-op intencional.
    pass
