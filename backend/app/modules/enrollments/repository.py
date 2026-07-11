import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.enrollments.models import Enrollment


class EnrollmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_course(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> Enrollment | None:
        statement = select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
        return self.db.scalar(statement)

    def exists(self, user_id: uuid.UUID, course_id: uuid.UUID) -> bool:
        statement = (
            select(func.count())
            .select_from(Enrollment)
            .where(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id,
            )
        )
        return (self.db.scalar(statement) or 0) > 0

    def create(self, user_id: uuid.UUID, course_id: uuid.UUID) -> Enrollment:
        enrollment = Enrollment(
            user_id=user_id,
            course_id=course_id,
        )

        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)

        return enrollment

    def list_by_user(
        self,
        user_id: uuid.UUID,
        skip: int,
        limit: int,
    ) -> list[Enrollment]:
        statement = (
            select(Enrollment)
            .where(Enrollment.user_id == user_id)
            .options(joinedload(Enrollment.course))
            .order_by(Enrollment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_by_user(self, user_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(Enrollment)
            .where(Enrollment.user_id == user_id)
        )
        return self.db.scalar(statement) or 0

    def list_all(
        self,
        skip: int,
        limit: int,
        course_id: uuid.UUID | None = None,
    ) -> list[Enrollment]:
        statement = (
            select(Enrollment)
            .options(
                joinedload(Enrollment.student),
                joinedload(Enrollment.course),
            )
            .order_by(Enrollment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if course_id is not None:
            statement = statement.where(Enrollment.course_id == course_id)

        return list(self.db.scalars(statement).all())

    def count_all(self, course_id: uuid.UUID | None = None) -> int:
        statement = select(func.count()).select_from(Enrollment)

        if course_id is not None:
            statement = statement.where(Enrollment.course_id == course_id)

        return self.db.scalar(statement) or 0
