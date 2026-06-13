import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.certificates.models import Certificate
from app.modules.course_modules.models import Module
from app.modules.courses.models import Course
from app.modules.enrollments.models import Enrollment
from app.modules.lessons.models import Lesson
from app.modules.progress.models import LessonProgress
from app.modules.ratings.models import Rating
from app.modules.users.models import Role, User
from app.shared.enums import CourseStatus, RoleName


class MetricsRepository:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ #
    # Conteos globales (ADMIN)
    # ------------------------------------------------------------------ #

    def count_users_by_role(self) -> dict[str, int]:
        statement = (
            select(Role.name, func.count(User.id))
            .join(User, User.role_id == Role.id)
            .group_by(Role.name)
        )
        by_role = {name: count for name, count in self.db.execute(statement).all()}

        active = self.db.scalar(
            select(func.count()).select_from(User).where(User.is_active.is_(True))
        )

        return {
            "total": sum(by_role.values()),
            "admins": by_role.get(RoleName.ADMIN.value, 0),
            "instructors": by_role.get(RoleName.INSTRUCTOR.value, 0),
            "students": by_role.get(RoleName.STUDENT.value, 0),
            "active": active or 0,
        }

    def count_courses_by_status(
        self,
        instructor_id: uuid.UUID | None = None,
    ) -> dict[CourseStatus, int]:
        statement = select(Course.status, func.count(Course.id))
        if instructor_id is not None:
            statement = statement.where(Course.instructor_id == instructor_id)
        statement = statement.group_by(Course.status)

        return {status: count for status, count in self.db.execute(statement).all()}

    def count_enrollments(self, course_ids: list[uuid.UUID] | None = None) -> int:
        statement = select(func.count()).select_from(Enrollment)
        if course_ids is not None:
            statement = statement.where(Enrollment.course_id.in_(course_ids))
        return self.db.scalar(statement) or 0

    def count_certificates(self, course_ids: list[uuid.UUID] | None = None) -> int:
        statement = select(func.count()).select_from(Certificate)
        if course_ids is not None:
            statement = statement.where(Certificate.course_id.in_(course_ids))
        return self.db.scalar(statement) or 0

    # ------------------------------------------------------------------ #
    # Agregaciones por curso (una consulta por métrica para evitar N+1)
    # ------------------------------------------------------------------ #

    def enrollments_by_course(
        self,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        if not course_ids:
            return {}
        statement = (
            select(Enrollment.course_id, func.count(Enrollment.id))
            .where(Enrollment.course_id.in_(course_ids))
            .group_by(Enrollment.course_id)
        )
        return {cid: count for cid, count in self.db.execute(statement).all()}

    def certificates_by_course(
        self,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        if not course_ids:
            return {}
        statement = (
            select(Certificate.course_id, func.count(Certificate.id))
            .where(Certificate.course_id.in_(course_ids))
            .group_by(Certificate.course_id)
        )
        return {cid: count for cid, count in self.db.execute(statement).all()}

    def ratings_by_course(
        self,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, tuple[float, int]]:
        if not course_ids:
            return {}
        statement = (
            select(
                Rating.course_id,
                func.avg(Rating.score),
                func.count(Rating.id),
            )
            .where(Rating.course_id.in_(course_ids))
            .group_by(Rating.course_id)
        )
        return {
            cid: (float(avg), count)
            for cid, avg, count in self.db.execute(statement).all()
        }

    # ------------------------------------------------------------------ #
    # Cursos
    # ------------------------------------------------------------------ #

    def list_courses_by_instructor(self, instructor_id: uuid.UUID) -> list[Course]:
        statement = (
            select(Course)
            .where(Course.instructor_id == instructor_id)
            .order_by(Course.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def top_courses_by_enrollments(self, limit: int) -> list[tuple[Course, int]]:
        enrollment_count = func.count(Enrollment.id)
        statement = (
            select(Course, enrollment_count)
            .outerjoin(Enrollment, Enrollment.course_id == Course.id)
            .group_by(Course.id)
            .order_by(enrollment_count.desc(), Course.created_at.desc())
            .limit(limit)
        )
        return [(course, count) for course, count in self.db.execute(statement).all()]

    # ------------------------------------------------------------------ #
    # Progreso del estudiante (STUDENT)
    # ------------------------------------------------------------------ #

    def list_enrollments_with_course(self, user_id: uuid.UUID) -> list[Enrollment]:
        statement = (
            select(Enrollment)
            .where(Enrollment.user_id == user_id)
            .options(joinedload(Enrollment.course))
            .order_by(Enrollment.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def lessons_count_by_courses(
        self,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        if not course_ids:
            return {}
        statement = (
            select(Module.course_id, func.count(Lesson.id))
            .join(Lesson, Lesson.module_id == Module.id)
            .where(Module.course_id.in_(course_ids))
            .group_by(Module.course_id)
        )
        return {cid: count for cid, count in self.db.execute(statement).all()}

    def completed_lessons_by_courses(
        self,
        user_id: uuid.UUID,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, int]:
        if not course_ids:
            return {}
        statement = (
            select(Module.course_id, func.count(LessonProgress.id))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .where(
                LessonProgress.user_id == user_id,
                Module.course_id.in_(course_ids),
                LessonProgress.is_completed.is_(True),
            )
            .group_by(Module.course_id)
        )
        return {cid: count for cid, count in self.db.execute(statement).all()}

    def certificate_course_ids(
        self,
        user_id: uuid.UUID,
        course_ids: list[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not course_ids:
            return set()
        statement = select(Certificate.course_id).where(
            Certificate.user_id == user_id,
            Certificate.course_id.in_(course_ids),
        )
        return set(self.db.scalars(statement).all())
