import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.lessons.service import LessonService
from app.modules.materials.models import SupplementalMaterial
from app.modules.materials.repository import MaterialRepository
from app.modules.users.models import User
from app.shared.enums import MaterialType
from app.shared.storage import delete_file, save_upload

# Formatos permitidos (BR-014). No se admiten ZIP ni RAR.
MATERIAL_TYPE_BY_EXTENSION: dict[str, MaterialType] = {
    ".pdf": MaterialType.PDF,
    ".jpg": MaterialType.IMAGE,
    ".jpeg": MaterialType.IMAGE,
    ".png": MaterialType.IMAGE,
    ".gif": MaterialType.IMAGE,
    ".webp": MaterialType.IMAGE,
    ".doc": MaterialType.OFFICE,
    ".docx": MaterialType.OFFICE,
    ".xls": MaterialType.OFFICE,
    ".xlsx": MaterialType.OFFICE,
    ".ppt": MaterialType.OFFICE,
    ".pptx": MaterialType.OFFICE,
}


class MaterialService:
    def __init__(self, db: Session):
        self.material_repository = MaterialRepository(db)
        # Reutiliza el control de propiedad/consumo de clases.
        self.lesson_service = LessonService(db)

    def add_material(
        self,
        lesson_id: uuid.UUID,
        upload: UploadFile,
        current_user: User,
    ) -> SupplementalMaterial:
        self.lesson_service.get_managed_lesson(lesson_id, current_user)

        extension = Path(upload.filename or "").suffix.lower()
        material_type = MATERIAL_TYPE_BY_EXTENSION.get(extension)
        if material_type is None:
            raise BadRequestException("Formato de material no permitido")

        file_path = save_upload(
            upload,
            subdir="materials",
            max_bytes=settings.MAX_MATERIAL_SIZE_MB * 1024 * 1024,
        )

        return self.material_repository.create(
            lesson_id=lesson_id,
            file_path=file_path,
            original_name=(upload.filename or "material")[:255],
            material_type=material_type,
        )

    def list_materials(
        self,
        lesson_id: uuid.UUID,
        current_user: User | None,
    ) -> list[SupplementalMaterial]:
        self.lesson_service.get_consumable_lesson(lesson_id, current_user)
        return self.material_repository.list_by_lesson(lesson_id)

    def get_material_for_download(
        self,
        material_id: uuid.UUID,
        current_user: User | None,
    ) -> SupplementalMaterial:
        material = self.material_repository.get_by_id(material_id)

        if material is None:
            raise NotFoundException("Material no encontrado")

        self.lesson_service.get_consumable_lesson(material.lesson_id, current_user)
        return material

    def delete_material(
        self,
        material_id: uuid.UUID,
        current_user: User,
    ) -> None:
        material = self.material_repository.get_by_id(material_id)

        if material is None:
            raise NotFoundException("Material no encontrado")

        self.lesson_service.get_managed_lesson(material.lesson_id, current_user)

        previous_path = material.file_path
        self.material_repository.delete(material)
        delete_file(previous_path)
