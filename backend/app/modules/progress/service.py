import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.modules.course_modules.repository import ModuleRepository
from app.modules.courses.repository import CourseRepository
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.lessons.repository import LessonRepository
from app.modules.progress.models import LessonProgress
from app.modules.progress.repository import ProgressRepository
from app.modules.progress.schemas import (
    CourseProgressResponse,
    LessonProgressResponse,
)
from app.modules.users.models import User


class ProgressService:
    def __init__(self, db: Session):
        self.progress_repository = ProgressRepository(db)
        self.lesson_repository = LessonRepository(db)
        self.module_repository = ModuleRepository(db)
        self.course_repository = CourseRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)

    def _resolve_course_and_authorize(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> uuid.UUID:
        # El progreso solo aplica a estudiantes matriculados en el curso que
        # contiene la clase (BR-016); se resuelve lesson -> module -> course.
        lesson = self.lesson_repository.get_by_id(lesson_id)
        if lesson is None:
            raise NotFoundException("Clase no encontrada")

        module = self.module_repository.get_by_id(lesson.module_id)
        if module is None:
            raise NotFoundException("Clase no encontrada")

        if not self.enrollment_repository.exists(current_user.id, module.course_id):
            raise ForbiddenException("No se encuentra matriculado en este curso")

        return module.course_id

    def _get_or_create(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> LessonProgress:
        progress = self.progress_repository.get_by_user_and_lesson(
            current_user.id,
            lesson_id,
        )
        if progress is None:
            progress = self.progress_repository.create(current_user.id, lesson_id)
        return progress

    def save_last_second(
        self,
        lesson_id: uuid.UUID,
        last_second: int,
        current_user: User,
    ) -> LessonProgress:
        self._resolve_course_and_authorize(lesson_id, current_user)

        progress = self._get_or_create(lesson_id, current_user)
        progress.last_second = last_second

        return self.progress_repository.save(progress)

    def complete_lesson(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> LessonProgress:
        self._resolve_course_and_authorize(lesson_id, current_user)

        progress = self._get_or_create(lesson_id, current_user)
        progress.is_completed = True
        progress.completed_at = datetime.now(timezone.utc)

        return self.progress_repository.save(progress)

    def get_lesson_progress(
        self,
        lesson_id: uuid.UUID,
        current_user: User,
    ) -> LessonProgressResponse:
        self._resolve_course_and_authorize(lesson_id, current_user)

        progress = self.progress_repository.get_by_user_and_lesson(
            current_user.id,
            lesson_id,
        )

        # Sin registro previo, la clase aún no se ha iniciado: avance por defecto.
        if progress is None:
            return LessonProgressResponse(
                lesson_id=lesson_id,
                last_second=0,
                is_completed=False,
                completed_at=None,
            )

        return LessonProgressResponse.model_validate(progress)

    def get_course_progress(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> CourseProgressResponse:
        course = self.course_repository.get_by_id(course_id)
        if course is None:
            raise NotFoundException("Curso no encontrado")

        if not self.enrollment_repository.exists(current_user.id, course_id):
            raise ForbiddenException("No se encuentra matriculado en este curso")

        total_lessons = self.lesson_repository.count_by_course(course_id)
        completed_lessons = self.progress_repository.count_completed_by_course(
            current_user.id,
            course_id,
        )

        # El avance del curso se calcula sobre las clases completadas (BR-019).
        percentage = (
            round(completed_lessons / total_lessons * 100, 2)
            if total_lessons
            else 0.0
        )

        records = self.progress_repository.list_by_user_and_course(
            current_user.id,
            course_id,
        )

        last_lesson_id = self.progress_repository.last_accessed_lesson_id(
            current_user.id,
            course_id,
        )

        return CourseProgressResponse(
            course_id=course_id,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            percentage=percentage,
            last_lesson_id=last_lesson_id,
            lessons=[LessonProgressResponse.model_validate(r) for r in records],
        )
