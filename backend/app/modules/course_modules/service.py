import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.course_modules.models import Module
from app.modules.course_modules.repository import ModuleRepository
from app.modules.course_modules.schemas import ModuleCreate, ModuleUpdate
from app.modules.courses.service import CourseService
from app.modules.users.models import User


class ModuleService:
    def __init__(self, db: Session):
        self.module_repository = ModuleRepository(db)
        # Reutiliza el control de propiedad/rol del módulo de cursos.
        self.course_service = CourseService(db)

    def _assert_course_managed(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> None:
        self.course_service.get_managed_course(course_id, current_user)

    def get_managed_module(
        self,
        module_id: uuid.UUID,
        current_user: User,
    ) -> Module:
        module = self.module_repository.get_by_id(module_id)

        if module is None:
            raise NotFoundException("Módulo no encontrado")

        self._assert_course_managed(module.course_id, current_user)
        return module

    def create_module(
        self,
        course_id: uuid.UUID,
        module_data: ModuleCreate,
        current_user: User,
    ) -> Module:
        self._assert_course_managed(course_id, current_user)

        position = self.module_repository.next_position(course_id)
        return self.module_repository.create(
            course_id=course_id,
            title=module_data.title,
            description=module_data.description,
            position=position,
        )

    def list_modules(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> list[Module]:
        self._assert_course_managed(course_id, current_user)
        return self.module_repository.list_by_course(course_id)

    def update_module(
        self,
        module_id: uuid.UUID,
        module_data: ModuleUpdate,
        current_user: User,
    ) -> Module:
        module = self.get_managed_module(module_id, current_user)

        if module_data.title is not None:
            module.title = module_data.title

        if module_data.description is not None:
            module.description = module_data.description

        return self.module_repository.save(module)

    def delete_module(
        self,
        module_id: uuid.UUID,
        current_user: User,
    ) -> None:
        module = self.get_managed_module(module_id, current_user)
        self.module_repository.delete(module)

    def reorder_modules(
        self,
        course_id: uuid.UUID,
        module_ids: list[uuid.UUID],
        current_user: User,
    ) -> list[Module]:
        self._assert_course_managed(course_id, current_user)

        modules = self.module_repository.list_by_course(course_id)

        # La lista recibida debe coincidir exactamente con los módulos del curso.
        if set(module_ids) != {module.id for module in modules}:
            raise BadRequestException(
                "La lista debe contener exactamente los módulos del curso"
            )

        position_by_id = {
            module_id: index + 1
            for index, module_id in enumerate(module_ids)
        }
        for module in modules:
            module.position = position_by_id[module.id]

        return self.module_repository.save_reorder(modules)
