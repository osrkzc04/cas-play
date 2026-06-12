import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
)
from app.modules.course_modules.service import ModuleService
from app.modules.lessons.models import Lesson
from app.modules.lessons.repository import LessonRepository
from app.modules.lessons.schemas import LessonCreate, LessonUpdate
from app.modules.users.models import User
from app.shared.storage import delete_file, save_upload

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v", ".ogg"}


class LessonService:
    def __init__(self, db: Session):
        self.lesson_repository = LessonRepository(db)
        # Reutiliza el control de propiedad/rol de módulos (y de cursos).
        self.module_service = ModuleService(db)

    def _assert_module_managed(
        self,
        module_id: uuid.UUID,
        current_user: User,
    ) -> None:
        self.module_service.get_managed_module(module_id, current_user)

    def _get_owned_lesson(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> Lesson:
        lesson = self.lesson_repository.get_by_id(lesson_id)

        if lesson is None:
            raise NotFoundException("Clase no encontrada")

        self._assert_module_managed(lesson.module_id, current_user)
        return lesson

    def get_managed_lesson(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> Lesson:
        return self._get_owned_lesson(lesson_id, current_user)

    def get_consumable_lesson(
        self,
        lesson_id: uuid.UUID,
        current_user: User | None,
    ) -> Lesson:
        lesson = self.lesson_repository.get_by_id(lesson_id)

        if lesson is None:
            raise NotFoundException("Clase no encontrada")

        # Las clases de vista previa son públicas; el resto exige ser gestor
        # del curso. El acceso de estudiantes matriculados llega en Sprint 4.
        if lesson.is_preview:
            return lesson

        if current_user is None:
            raise UnauthorizedException("Autenticación requerida")

        self._assert_module_managed(lesson.module_id, current_user)
        return lesson

    def create_lesson(
        self,
        module_id: uuid.UUID,
        lesson_data: LessonCreate,
        current_user: User,
    ) -> Lesson:
        self._assert_module_managed(module_id, current_user)

        position = self.lesson_repository.next_position(module_id)
        return self.lesson_repository.create(
            module_id=module_id,
            title=lesson_data.title,
            description=lesson_data.description,
            is_preview=lesson_data.is_preview,
            position=position,
        )

    def list_lessons(
        self,
        module_id: uuid.UUID,
        current_user: User,
    ) -> list[Lesson]:
        self._assert_module_managed(module_id, current_user)
        return self.lesson_repository.list_by_module(module_id)

    def update_lesson(
        self,
        lesson_id: uuid.UUID,
        lesson_data: LessonUpdate,
        current_user: User,
    ) -> Lesson:
        lesson = self._get_owned_lesson(lesson_id, current_user)

        if lesson_data.title is not None:
            lesson.title = lesson_data.title

        if lesson_data.description is not None:
            lesson.description = lesson_data.description

        if lesson_data.is_preview is not None:
            lesson.is_preview = lesson_data.is_preview

        return self.lesson_repository.save(lesson)

    def delete_lesson(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> None:
        lesson = self._get_owned_lesson(lesson_id, current_user)
        self.lesson_repository.delete(lesson)

    def reorder_lessons(
        self,
        module_id: uuid.UUID,
        lesson_ids: list[uuid.UUID],
        current_user: User,
    ) -> list[Lesson]:
        self._assert_module_managed(module_id, current_user)

        lessons = self.lesson_repository.list_by_module(module_id)

        # La lista recibida debe coincidir exactamente con las clases del módulo.
        if set(lesson_ids) != {lesson.id for lesson in lessons}:
            raise BadRequestException(
                "La lista debe contener exactamente las clases del módulo"
            )

        position_by_id = {
            lesson_id: index + 1
            for index, lesson_id in enumerate(lesson_ids)
        }
        for lesson in lessons:
            lesson.position = position_by_id[lesson.id]

        return self.lesson_repository.save_reorder(lessons)

    def set_video(
        self,
        lesson_id: uuid.UUID,
        upload: UploadFile,
        current_user: User,
    ) -> Lesson:
        lesson = self._get_owned_lesson(lesson_id, current_user)

        extension = Path(upload.filename or "").suffix.lower()
        if extension not in ALLOWED_VIDEO_EXTENSIONS:
            raise BadRequestException("Formato de video no permitido")

        previous_path = lesson.video_path
        lesson.video_path = save_upload(
            upload,
            subdir="videos",
            max_bytes=settings.MAX_VIDEO_SIZE_MB * 1024 * 1024,
        )
        saved = self.lesson_repository.save(lesson)

        # Se elimina el archivo anterior solo tras persistir el nuevo.
        if previous_path:
            delete_file(previous_path)

        return saved

    def delete_video(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> Lesson:
        lesson = self._get_owned_lesson(lesson_id, current_user)

        if lesson.video_path is None:
            raise BadRequestException("La clase no tiene un video asignado")

        previous_path = lesson.video_path
        lesson.video_path = None
        saved = self.lesson_repository.save(lesson)
        delete_file(previous_path)

        return saved

    def get_lesson_for_video(
        self,
        lesson_id: uuid.UUID,
        current_user: User | None,
    ) -> Lesson:
        lesson = self.get_consumable_lesson(lesson_id, current_user)

        if lesson.video_path is None:
            raise NotFoundException("Video no encontrado")

        return lesson
