"""evaluation per course and certificate final score

Revision ID: b8c9d0e1f2a3
Revises: f6a7b8c9d0e1
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # La evaluación pasa de nivel módulo a nivel curso (BR-020). Las evaluaciones
    # existentes por módulo quedan inválidas: se eliminan en cascada (preguntas,
    # intentos y respuestas) antes de cambiar la llave foránea.
    op.execute("DELETE FROM evaluations")

    op.drop_index(op.f('ix_evaluations_module_id'), table_name='evaluations')
    op.drop_constraint('uq_evaluation_module', 'evaluations', type_='unique')
    op.drop_constraint('evaluations_module_id_fkey', 'evaluations', type_='foreignkey')
    op.drop_column('evaluations', 'module_id')

    op.add_column('evaluations', sa.Column('course_id', sa.UUID(), nullable=False))
    op.create_index(
        op.f('ix_evaluations_course_id'), 'evaluations', ['course_id'], unique=False
    )
    op.create_foreign_key(
        'evaluations_course_id_fkey',
        'evaluations',
        'courses',
        ['course_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_unique_constraint('uq_evaluation_course', 'evaluations', ['course_id'])

    # El certificado pasa a registrar la nota de la evaluación final del curso.
    op.alter_column(
        'certificates', 'average_score', new_column_name='final_score'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'certificates', 'final_score', new_column_name='average_score'
    )

    op.execute("DELETE FROM evaluations")

    op.drop_constraint('uq_evaluation_course', 'evaluations', type_='unique')
    op.drop_constraint('evaluations_course_id_fkey', 'evaluations', type_='foreignkey')
    op.drop_index(op.f('ix_evaluations_course_id'), table_name='evaluations')
    op.drop_column('evaluations', 'course_id')

    op.add_column('evaluations', sa.Column('module_id', sa.UUID(), nullable=False))
    op.create_index(
        op.f('ix_evaluations_module_id'), 'evaluations', ['module_id'], unique=False
    )
    op.create_foreign_key(
        'evaluations_module_id_fkey',
        'evaluations',
        'modules',
        ['module_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_unique_constraint('uq_evaluation_module', 'evaluations', ['module_id'])
