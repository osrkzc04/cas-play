import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.course_modules.models import Module
from app.modules.lessons.models import Lesson
from app.modules.progress.models import LessonProgress


class ProgressRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: uuid.UUID,
    ) -> LessonProgress | None:
        statement = select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson_id,
        )
        return self.db.scalar(statement)

    def create(
        self,
        user_id: uuid.UUID,
        lesson_id: uuid.UUID,
    ) -> LessonProgress:
        progress = LessonProgress(
            user_id=user_id,
            lesson_id=lesson_id,
        )

        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)

        return progress

    def save(self, progress: LessonProgress) -> LessonProgress:
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def list_by_user_and_course(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> list[LessonProgress]:
        statement = (
            select(LessonProgress)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                LessonProgress.user_id == user_id,
                Module.course_id == course_id,
            )
        )
        return list(self.db.scalars(statement).all())

    def completed_counts_by_course(
        self,
        course_id: uuid.UUID,
    ) -> dict[uuid.UUID, int]:
        # Clases completadas por estudiante en el curso, en una sola consulta.
        statement = (
            select(LessonProgress.user_id, func.count())
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                Module.course_id == course_id,
                LessonProgress.is_completed.is_(True),
            )
            .group_by(LessonProgress.user_id)
        )
        return {user_id: count for user_id, count in self.db.execute(statement)}

    def last_accessed_lesson_id(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> uuid.UUID | None:
        # Clase con actividad más reciente del estudiante en el curso, para
        # reanudar donde lo dejó (BR-018).
        statement = (
            select(LessonProgress.lesson_id)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                LessonProgress.user_id == user_id,
                Module.course_id == course_id,
            )
            .order_by(LessonProgress.updated_at.desc())
            .limit(1)
        )
        return self.db.scalar(statement)

    def count_completed_by_course(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> int:
        statement = (
            select(func.count())
            .select_from(LessonProgress)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                LessonProgress.user_id == user_id,
                Module.course_id == course_id,
                LessonProgress.is_completed.is_(True),
            )
        )
        return self.db.scalar(statement) or 0
