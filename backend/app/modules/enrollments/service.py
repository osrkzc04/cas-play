import math
import uuid

from sqlalchemy.orm import Session

from app.core.email import build_welcome_email, send_email
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.modules.audit.service import AuditService
from app.modules.courses.repository import CourseRepository
from app.modules.courses.service import CourseService
from app.modules.enrollments.models import Enrollment
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.enrollments.schemas import AdminEnrollmentCreate, CourseStudentItem
from app.modules.lessons.repository import LessonRepository
from app.modules.progress.repository import ProgressRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.shared.enums import AuditAction, CourseStatus, RoleName
from app.shared.pagination import PaginatedResponse


class EnrollmentService:
    def __init__(self, db: Session):
        self.enrollment_repository = EnrollmentRepository(db)
        self.course_repository = CourseRepository(db)
        self.user_repository = UserRepository(db)
        self.user_service = UserService(db)
        self.lesson_repository = LessonRepository(db)
        self.progress_repository = ProgressRepository(db)
        # Reutiliza el control de propiedad/rol del módulo de cursos.
        self.course_service = CourseService(db)
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

    def create_admin_enrollment(
        self,
        data: AdminEnrollmentCreate,
        actor: User,
    ) -> tuple[Enrollment, User, bool]:
        course = self.course_repository.get_by_id(data.course_id)

        if course is None or course.status != CourseStatus.PUBLISHED:
            raise NotFoundException("Curso no encontrado")

        user = self.user_repository.get_by_email(data.email)
        user_created = False

        if user is None:
            # El correo no existe: la matrícula implica dar de alta al estudiante.
            if data.first_name is None or data.last_name is None:
                raise BadRequestException(
                    "Debe indicar nombre y apellido para crear un usuario nuevo"
                )

            user, temporary_password = (
                self.user_service.create_student_with_temp_password(
                    first_name=data.first_name,
                    last_name=data.last_name,
                    email=data.email,
                    actor=actor,
                )
            )
            user_created = True

            send_email(
                to=user.email,
                subject="Acceso a la plataforma de Culinary Arts School",
                html_body=build_welcome_email(
                    first_name=user.first_name,
                    email=user.email,
                    temporary_password=temporary_password,
                ),
            )
        else:
            if user.role.name != RoleName.STUDENT.value:
                raise BadRequestException(
                    "El correo pertenece a un usuario que no es estudiante"
                )

            if not user.is_active:
                raise BadRequestException("El usuario se encuentra inactivo")

        if self.enrollment_repository.exists(user.id, course.id):
            raise ConflictException("El estudiante ya se encuentra matriculado en este curso")

        enrollment = self.enrollment_repository.create(
            user_id=user.id,
            course_id=course.id,
        )

        self.audit.record(
            action=AuditAction.ENROLLMENT_CREATED,
            actor_id=actor.id,
            entity_type="enrollment",
            entity_id=enrollment.id,
            details={
                "course_id": str(course.id),
                "student_id": str(user.id),
                "user_created": user_created,
            },
        )

        return enrollment, user, user_created

    def list_admin_enrollments(
        self,
        page: int,
        size: int,
        course_id: uuid.UUID | None = None,
    ) -> PaginatedResponse:
        skip = (page - 1) * size

        items = self.enrollment_repository.list_all(
            skip=skip,
            limit=size,
            course_id=course_id,
        )
        total = self.enrollment_repository.count_all(course_id=course_id)

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def list_course_students(
        self,
        course_id: uuid.UUID,
        current_user: User,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        # Solo el gestor del curso (ADMIN o instructor propietario) puede ver
        # a sus estudiantes y el avance de cada uno.
        self.course_service.get_managed_course(course_id, current_user)

        total_lessons = self.lesson_repository.count_by_course(course_id)
        completed_by_user = self.progress_repository.completed_counts_by_course(
            course_id
        )

        skip = (page - 1) * size
        enrollments = self.enrollment_repository.list_all(
            skip=skip,
            limit=size,
            course_id=course_id,
        )
        total = self.enrollment_repository.count_all(course_id=course_id)

        items: list[CourseStudentItem] = []
        for enrollment in enrollments:
            student = enrollment.student
            completed = completed_by_user.get(student.id, 0)
            percentage = (
                round(completed / total_lessons * 100, 2) if total_lessons else 0.0
            )
            items.append(
                CourseStudentItem(
                    user_id=student.id,
                    first_name=student.first_name,
                    last_name=student.last_name,
                    email=student.email,
                    enrolled_at=enrollment.created_at,
                    total_lessons=total_lessons,
                    completed_lessons=completed,
                    progress_percentage=percentage,
                )
            )

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def lookup_user_by_email(self, email: str) -> User | None:
        return self.user_repository.get_by_email(email)
