import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.lessons.models import Lesson
from app.modules.materials.models import SupplementalMaterial
from app.shared.enums import MaterialType


class MaterialRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, material_id: uuid.UUID) -> SupplementalMaterial | None:
        statement = select(SupplementalMaterial).where(
            SupplementalMaterial.id == material_id
        )
        return self.db.scalar(statement)

    def count_by_module(self, module_id: uuid.UUID) -> dict[uuid.UUID, int]:
        # Conteo de materiales por clase del módulo en una sola consulta.
        statement = (
            select(SupplementalMaterial.lesson_id, func.count())
            .join(Lesson, Lesson.id == SupplementalMaterial.lesson_id)
            .where(Lesson.module_id == module_id)
            .group_by(SupplementalMaterial.lesson_id)
        )
        return {lesson_id: count for lesson_id, count in self.db.execute(statement)}

    def list_by_lesson(self, lesson_id: uuid.UUID) -> list[SupplementalMaterial]:
        statement = (
            select(SupplementalMaterial)
            .where(SupplementalMaterial.lesson_id == lesson_id)
            .order_by(SupplementalMaterial.created_at)
        )
        return list(self.db.scalars(statement).all())

    def create(
        self,
        lesson_id: uuid.UUID,
        file_path: str,
        original_name: str,
        material_type: MaterialType,
    ) -> SupplementalMaterial:
        material = SupplementalMaterial(
            lesson_id=lesson_id,
            file_path=file_path,
            original_name=original_name,
            material_type=material_type,
        )

        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)

        return material

    def delete(self, material: SupplementalMaterial) -> None:
        self.db.delete(material)
        self.db.commit()
