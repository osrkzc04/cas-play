"""add informative fields to courses

Revision ID: d4e5f6a7b8c9
Revises: a7c4e1b9d2f8
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'a7c4e1b9d2f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# create_type=False evita que ADD COLUMN intente recrear el tipo; la creación
# se realiza explícitamente con checkfirst.
course_level_enum = postgresql.ENUM(
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    name='course_level',
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    course_level_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('courses', sa.Column('summary', sa.String(length=300), nullable=True))
    op.add_column('courses', sa.Column('level', course_level_enum, nullable=True))
    op.add_column('courses', sa.Column('cover_image_url', sa.String(length=500), nullable=True))
    op.add_column('courses', sa.Column('duration_hours', sa.Integer(), nullable=True))
    op.add_column('courses', sa.Column('requirements', sa.Text(), nullable=True))
    op.add_column('courses', sa.Column('target_audience', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('courses', 'target_audience')
    op.drop_column('courses', 'requirements')
    op.drop_column('courses', 'duration_hours')
    op.drop_column('courses', 'cover_image_url')
    op.drop_column('courses', 'level')
    op.drop_column('courses', 'summary')

    course_level_enum.drop(op.get_bind(), checkfirst=True)
