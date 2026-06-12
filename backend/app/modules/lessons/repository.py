import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.course_modules.models import Module
from app.modules.lessons.models import Lesson


class LessonRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, lesson_id: uuid.UUID) -> Lesson | None:
        statement = select(Lesson).where(Lesson.id == lesson_id)
        return self.db.scalar(statement)

    def count_by_course(self, course_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(Lesson)
            .join(Module, Module.id == Lesson.module_id)
            .where(Module.course_id == course_id)
        )
        return self.db.scalar(statement) or 0

    def list_by_module(self, module_id: uuid.UUID) -> list[Lesson]:
        statement = (
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.position)
        )
        return list(self.db.scalars(statement).all())

    def next_position(self, module_id: uuid.UUID) -> int:
        statement = (
            select(func.coalesce(func.max(Lesson.position), 0))
            .where(Lesson.module_id == module_id)
        )
        return (self.db.scalar(statement) or 0) + 1

    def create(
        self,
        module_id: uuid.UUID,
        title: str,
        description: str | None,
        is_preview: bool,
        position: int,
    ) -> Lesson:
        lesson = Lesson(
            module_id=module_id,
            title=title,
            description=description,
            is_preview=is_preview,
            position=position,
        )

        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)

        return lesson

    def save(self, lesson: Lesson) -> Lesson:
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def save_reorder(self, lessons: list[Lesson]) -> list[Lesson]:
        self.db.commit()
        for lesson in lessons:
            self.db.refresh(lesson)
        return sorted(lessons, key=lambda lesson: lesson.position)

    def delete(self, lesson: Lesson) -> None:
        self.db.delete(lesson)
        self.db.commit()
