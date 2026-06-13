import math
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.modules.audit.service import AuditService
from app.modules.courses.repository import CourseRepository
from app.modules.enrollments.models import Enrollment
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.users.models import User
from app.shared.enums import AuditAction, CourseStatus
from app.shared.pagination import PaginatedResponse


class EnrollmentService:
    def __init__(self, db: Session):
        self.enrollment_repository = EnrollmentRepository(db)
        self.course_repository = CourseRepository(db)
        self.audit = AuditService(db)

    def enroll(self, course_id: uuid.UUID, current_user: User) -> Enrollment:
        course = self.course_repository.get_by_id(course_id)

        # Solo se permite matrícula en cursos disponibles públicamente.
        if course is None or course.status != CourseStatus.PUBLISHED:
            raise NotFoundException("Curso no encontrado")

        if self.enrollment_repository.exists(current_user.id, course_id):
            raise ConflictException("Ya se encuentra matriculado en este curso")

        enrollment = self.enrollment_repository.create(
            user_id=current_user.id,
            course_id=course_id,
        )

        self.audit.record(
            action=AuditAction.ENROLLMENT_CREATED,
            actor_id=current_user.id,
            entity_type="enrollment",
            entity_id=enrollment.id,
            details={"course_id": str(course_id)},
        )

        return enrollment

    def list_my_courses(
        self,
        current_user: User,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        skip = (page - 1) * size

        items = self.enrollment_repository.list_by_user(
            user_id=current_user.id,
            skip=skip,
            limit=size,
        )
        total = self.enrollment_repository.count_by_user(current_user.id)

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def is_enrolled(self, user_id: uuid.UUID, course_id: uuid.UUID) -> bool:
        # Reutilizable por Progress y Evaluations para validar acceso (BR-016).
        return self.enrollment_repository.exists(user_id, course_id)
