"""create certificates table

Revision ID: b7f1c2a93d40
Revises: 6c0d7b059f75
Create Date: 2026-06-12 18:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7f1c2a93d40'
down_revision: Union[str, Sequence[str], None] = '6c0d7b059f75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('certificates',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('course_id', sa.UUID(), nullable=False),
    sa.Column('code', sa.String(length=40), nullable=False),
    sa.Column('student_name', sa.String(length=201), nullable=False),
    sa.Column('course_title', sa.String(length=150), nullable=False),
    sa.Column('average_score', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('pdf_path', sa.String(length=500), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'course_id', name='uq_certificate_user_course')
    )
    # `code` se declara unique + index en el modelo: SQLAlchemy lo materializa
    # como un único índice único, no como constraint separada.
    op.create_index(op.f('ix_certificates_code'), 'certificates', ['code'], unique=True)
    op.create_index(op.f('ix_certificates_course_id'), 'certificates', ['course_id'], unique=False)
    op.create_index(op.f('ix_certificates_id'), 'certificates', ['id'], unique=False)
    op.create_index(op.f('ix_certificates_user_id'), 'certificates', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_certificates_user_id'), table_name='certificates')
    op.drop_index(op.f('ix_certificates_id'), table_name='certificates')
    op.drop_index(op.f('ix_certificates_course_id'), table_name='certificates')
    op.drop_index(op.f('ix_certificates_code'), table_name='certificates')
    op.drop_table('certificates')
