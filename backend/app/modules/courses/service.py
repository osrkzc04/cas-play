import math
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.audit.service import AuditService
from app.modules.courses.models import Course
from app.modules.instructor_profiles.service import InstructorProfileService
from app.modules.courses.repository import CourseRepository
from app.modules.courses.schemas import (
    CourseCatalogResponse,
    CourseCreate,
    CourseUpdate,
)
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.ratings.repository import RatingRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.enums import AuditAction, CourseStatus, RoleName
from app.shared.pagination import PaginatedResponse
from app.shared.storage import delete_file, save_upload

ALLOWED_COVER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class CourseService:
    # Transiciones de estado permitidas. FINISHED es terminal: un curso
    # finalizado no se republica para preservar la integridad de certificados.
    _ALLOWED_STATUS_TRANSITIONS: dict[CourseStatus, set[CourseStatus]] = {
        CourseStatus.DRAFT: {CourseStatus.PUBLISHED},
        CourseStatus.PUBLISHED: {CourseStatus.HIDDEN, CourseStatus.FINISHED},
        CourseStatus.HIDDEN: {CourseStatus.PUBLISHED, CourseStatus.FINISHED},
        CourseStatus.FINISHED: set(),
    }

    def __init__(self, db: Session):
        self.course_repository = CourseRepository(db)
        self.user_repository = UserRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        self.rating_repository = RatingRepository(db)
        self.audit = AuditService(db)

    def _is_admin(self, user: User) -> bool:
        return user.role.name == RoleName.ADMIN.value

    def _validate_instructor(self, instructor_id: uuid.UUID) -> None:
        instructor = self.user_repository.get_by_id(instructor_id)

        if instructor is None or instructor.role.name != RoleName.INSTRUCTOR.value:
            raise BadRequestException("El instructor asignado no es válido")

    def _get_owned_or_admin(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> Course:
        course = self.course_repository.get_by_id(course_id)

        if course is None:
            raise NotFoundException("Curso no encontrado")

        if not self._is_admin(current_user) and course.instructor_id != current_user.id:
            raise ForbiddenException("No tiene permisos sobre este curso")

        return course

    def create_course(
        self,
        course_data: CourseCreate,
        current_user: User,
    ) -> Course:
        if self._is_admin(current_user) and course_data.instructor_id is not None:
            self._validate_instructor(course_data.instructor_id)
            instructor_id = course_data.instructor_id
        else:
            # El INSTRUCTOR siempre crea cursos a su propio nombre.
            instructor_id = current_user.id

        course = self.course_repository.create(
            instructor_id=instructor_id,
            title=course_data.title,
            summary=course_data.summary,
            description=course_data.description,
            level=course_data.level,
            duration_hours=course_data.duration_hours,
            requirements=course_data.requirements,
            target_audience=course_data.target_audience,
        )

        self.audit.record(
            action=AuditAction.COURSE_CREATED,
            actor_id=current_user.id,
            entity_type="course",
            entity_id=course.id,
            details={"title": course.title},
        )

        return course

    def get_public_course(self, course_id: uuid.UUID) -> Course:
        course = self.course_repository.get_by_id(course_id)

        if course is None or course.status != CourseStatus.PUBLISHED:
            raise NotFoundException("Curso no encontrado")

        # Atributo no mapeado que alimenta `instructor` en CourseDetailResponse
        # (leído por el alias `instructor_public`), evitando una petición extra.
        course.instructor_public = InstructorProfileService.build_public(
            course.instructor
        )

        return course

    def update_course(
        self,
        course_id: uuid.UUID,
        course_data: CourseUpdate,
        current_user: User,
    ) -> Course:
        course = self._get_owned_or_admin(course_id, current_user)

        # Campos informativos: solo se actualizan los enviados (None = sin cambio).
        updatable_fields = (
            "title",
            "summary",
            "description",
            "level",
            "duration_hours",
            "requirements",
            "target_audience",
        )
        for field in updatable_fields:
            value = getattr(course_data, field)
            if value is not None:
                setattr(course, field, value)

        if course_data.instructor_id is not None:
            # Solo ADMIN puede reasignar el instructor de un curso.
            if not self._is_admin(current_user):
                raise ForbiddenException(
                    "No tiene permisos para reasignar el instructor"
                )
            self._validate_instructor(course_data.instructor_id)
            course.instructor_id = course_data.instructor_id

        return self.course_repository.save(course)

    def get_managed_course(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> Course:
        return self._get_owned_or_admin(course_id, current_user)

    def set_cover(
        self,
        course_id: uuid.UUID,
        upload: UploadFile,
        current_user: User,
    ) -> Course:
        course = self._get_owned_or_admin(course_id, current_user)

        extension = Path(upload.filename or "").suffix.lower()
        if extension not in ALLOWED_COVER_EXTENSIONS:
            raise BadRequestException("Formato de imagen no permitido")

        previous_path = course.cover_image_path
        course.cover_image_path = save_upload(
            upload,
            subdir="covers",
            max_bytes=settings.MAX_COVER_SIZE_MB * 1024 * 1024,
        )
        saved = self.course_repository.save(course)

        # Se elimina la portada anterior solo tras persistir la nueva.
        if previous_path:
            delete_file(previous_path)

        return saved

    def delete_cover(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> Course:
        course = self._get_owned_or_admin(course_id, current_user)

        if course.cover_image_path is None:
            raise BadRequestException("El curso no tiene una portada asignada")

        previous_path = course.cover_image_path
        course.cover_image_path = None
        saved = self.course_repository.save(course)
        delete_file(previous_path)

        return saved

    def get_cover_path(self, course_id: uuid.UUID) -> str:
        course = self.course_repository.get_by_id(course_id)

        if course is None or course.cover_image_path is None:
            raise NotFoundException("Portada no encontrada")

        return course.cover_image_path

    def user_manages_course(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> bool:
        # Verificación sin excepciones para decidir acceso (gestor vs. estudiante).
        course = self.course_repository.get_by_id(course_id)

        if course is None:
            return False

        return self._is_admin(current_user) or course.instructor_id == current_user.id

    def _change_status(
        self,
        course_id: uuid.UUID,
        new_status: CourseStatus,
        current_user: User,
    ) -> Course:
        course = self._get_owned_or_admin(course_id, current_user)

        if course.status == new_status:
            raise BadRequestException("El curso ya se encuentra en ese estado")

        if new_status not in self._ALLOWED_STATUS_TRANSITIONS[course.status]:
            raise BadRequestException(
                "La transición de estado solicitada no es válida para este curso"
            )

        course.status = new_status
        return self.course_repository.save(course)

    def publish_course(self, course_id: uuid.UUID, current_user: User) -> Course:
        course = self._change_status(course_id, CourseStatus.PUBLISHED, current_user)

        self.audit.record(
            action=AuditAction.COURSE_PUBLISHED,
            actor_id=current_user.id,
            entity_type="course",
            entity_id=course.id,
            details={"title": course.title},
        )

        return course

    def hide_course(self, course_id: uuid.UUID, current_user: User) -> Course:
        course = self._change_status(course_id, CourseStatus.HIDDEN, current_user)

        self.audit.record(
            action=AuditAction.COURSE_HIDDEN,
            actor_id=current_user.id,
            entity_type="course",
            entity_id=course.id,
            details={"title": course.title},
        )

        return course

    def finish_course(self, course_id: uuid.UUID, current_user: User) -> Course:
        return self._change_status(course_id, CourseStatus.FINISHED, current_user)

    def list_published(self, page: int, size: int) -> PaginatedResponse:
        skip = (page - 1) * size
        courses = self.course_repository.list_published(skip=skip, limit=size)
        total = self.course_repository.count_published()

        course_ids = [course.id for course in courses]
        enrolled_counts = self.enrollment_repository.counts_by_courses(course_ids)
        rating_aggregates = self.rating_repository.aggregates_by_courses(course_ids)

        items: list[CourseCatalogResponse] = []
        for course in courses:
            average, rating_count = rating_aggregates.get(course.id, (None, 0))
            instructor = course.instructor
            instructor_name = (
                f"{instructor.first_name} {instructor.last_name}".strip()
                if instructor is not None
                else None
            )
            items.append(
                CourseCatalogResponse.model_validate(course).model_copy(
                    update={
                        "instructor_name": instructor_name or None,
                        "enrolled_count": enrolled_counts.get(course.id, 0),
                        "rating_average": average,
                        "rating_count": rating_count,
                    }
                )
            )

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def list_manage(
        self,
        current_user: User,
        status: CourseStatus | None,
        page: int,
        size: int,
    ) -> PaginatedResponse:
        # ADMIN ve todos los cursos; INSTRUCTOR solo los suyos.
        instructor_id = None if self._is_admin(current_user) else current_user.id
        skip = (page - 1) * size

        items = self.course_repository.list_for_manager(
            instructor_id=instructor_id,
            status=status,
            skip=skip,
            limit=size,
        )
        total = self.course_repository.count_for_manager(
            instructor_id=instructor_id,
            status=status,
        )

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )
