"""create instructor_profiles table

Revision ID: c1d2e3f4a5b6
Revises: b8c9d0e1f2a3
Create Date: 2026-07-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'instructor_profiles',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('headline', sa.String(length=150), nullable=True),
        sa.Column('specialty', sa.String(length=120), nullable=True),
        sa.Column('about_me', sa.Text(), nullable=True),
        sa.Column('photo_path', sa.String(length=500), nullable=True),
        sa.Column(
            'social_links',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_instructor_profile_user'),
    )
    op.create_index(
        op.f('ix_instructor_profiles_id'),
        'instructor_profiles',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_instructor_profiles_user_id'),
        'instructor_profiles',
        ['user_id'],
        unique=False,
    )

    # ALTER TYPE ... ADD VALUE no puede ejecutarse dentro del bloque
    # transaccional de la migración; autocommit_block lo aísla.
    with op.get_context().autocommit_block():
        op.execute(
            "ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'PROFILE_UPDATED'"
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_instructor_profiles_user_id'),
        table_name='instructor_profiles',
    )
    op.drop_index(
        op.f('ix_instructor_profiles_id'),
        table_name='instructor_profiles',
    )
    op.drop_table('instructor_profiles')
    # PostgreSQL no admite eliminar valores de un tipo enum; PROFILE_UPDATED
    # permanece en audit_action tras el downgrade (no-op intencional).
