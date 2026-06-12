import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.courses.models import Course
from app.shared.enums import CourseStatus


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: uuid.UUID) -> Course | None:
        statement = select(Course).where(Course.id == course_id)
        return self.db.scalar(statement)

    def create(self, instructor_id: uuid.UUID, title: str, description: str | None) -> Course:
        course = Course(
            instructor_id=instructor_id,
            title=title,
            description=description,
        )

        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)

        return course

    def save(self, course: Course) -> Course:
        self.db.commit()
        self.db.refresh(course)
        return course

    def list_published(self, skip: int, limit: int) -> list[Course]:
        statement = (
            select(Course)
            .where(Course.status == CourseStatus.PUBLISHED)
            .order_by(Course.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_published(self) -> int:
        statement = (
            select(func.count())
            .select_from(Course)
            .where(Course.status == CourseStatus.PUBLISHED)
        )
        return self.db.scalar(statement) or 0

    def list_for_manager(
        self,
        instructor_id: uuid.UUID | None,
        status: CourseStatus | None,
        skip: int,
        limit: int,
    ) -> list[Course]:
        statement = select(Course)

        if instructor_id is not None:
            statement = statement.where(Course.instructor_id == instructor_id)

        if status is not None:
            statement = statement.where(Course.status == status)

        statement = (
            statement.order_by(Course.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_for_manager(
        self,
        instructor_id: uuid.UUID | None,
        status: CourseStatus | None,
    ) -> int:
        statement = select(func.count()).select_from(Course)

        if instructor_id is not None:
            statement = statement.where(Course.instructor_id == instructor_id)

        if status is not None:
            statement = statement.where(Course.status == status)

        return self.db.scalar(statement) or 0
