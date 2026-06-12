import math
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.courses.models import Course
from app.modules.courses.repository import CourseRepository
from app.modules.courses.schemas import CourseCreate, CourseUpdate
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.enums import CourseStatus, RoleName
from app.shared.pagination import PaginatedResponse


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

        return self.course_repository.create(
            instructor_id=instructor_id,
            title=course_data.title,
            description=course_data.description,
        )

    def get_public_course(self, course_id: uuid.UUID) -> Course:
        course = self.course_repository.get_by_id(course_id)

        if course is None or course.status != CourseStatus.PUBLISHED:
            raise NotFoundException("Curso no encontrado")

        return course

    def update_course(
        self,
        course_id: uuid.UUID,
        course_data: CourseUpdate,
        current_user: User,
    ) -> Course:
        course = self._get_owned_or_admin(course_id, current_user)

        if course_data.title is not None:
            course.title = course_data.title

        if course_data.description is not None:
            course.description = course_data.description

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
        return self._change_status(course_id, CourseStatus.PUBLISHED, current_user)

    def hide_course(self, course_id: uuid.UUID, current_user: User) -> Course:
        return self._change_status(course_id, CourseStatus.HIDDEN, current_user)

    def finish_course(self, course_id: uuid.UUID, current_user: User) -> Course:
        return self._change_status(course_id, CourseStatus.FINISHED, current_user)

    def list_published(self, page: int, size: int) -> PaginatedResponse:
        skip = (page - 1) * size
        items = self.course_repository.list_published(skip=skip, limit=size)
        total = self.course_repository.count_published()

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
