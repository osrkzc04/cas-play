import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

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
