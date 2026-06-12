import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.course_modules.schemas import (
    ModuleCreate,
    ModuleReorder,
    ModuleResponse,
    ModuleUpdate,
)
from app.modules.course_modules.service import ModuleService
from app.modules.courses.dependencies import require_course_manager
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(
    tags=["Modules"],
)


@router.post(
    "/courses/{course_id}/modules",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_module(
    course_id: uuid.UUID,
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = ModuleService(db)
    return service.create_module(course_id, module_data, current_user)


@router.get(
    "/courses/{course_id}/modules",
    response_model=list[ModuleResponse],
)
def list_modules(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = ModuleService(db)
    return service.list_modules(course_id, current_user)


@router.post(
    "/courses/{course_id}/modules/reorder",
    response_model=list[ModuleResponse],
)
def reorder_modules(
    course_id: uuid.UUID,
    reorder_data: ModuleReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = ModuleService(db)
    return service.reorder_modules(course_id, reorder_data.module_ids, current_user)


@router.patch(
    "/modules/{module_id}",
    response_model=ModuleResponse,
)
def update_module(
    module_id: uuid.UUID,
    module_data: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = ModuleService(db)
    return service.update_module(module_id, module_data, current_user)


@router.delete(
    "/modules/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_module(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = ModuleService(db)
    service.delete_module(module_id, current_user)
