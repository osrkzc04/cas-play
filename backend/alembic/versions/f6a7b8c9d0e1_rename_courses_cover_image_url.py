"""rename courses.cover_image_url to cover_image_path

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-19 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('courses', 'cover_image_url', new_column_name='cover_image_path')


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('courses', 'cover_image_path', new_column_name='cover_image_url')
