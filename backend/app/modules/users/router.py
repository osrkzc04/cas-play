import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.users.schemas import (
    RoleCreate,
    RoleResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.modules.users.service import RoleService, UserService
from app.modules.users.dependencies import require_admin
from app.shared.dependencies import get_db


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/roles",
    response_model=list[RoleResponse],
)
def get_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = RoleService(db)
    return service.get_roles()


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = RoleService(db)
    return service.create_role(role_data)


@router.get(
    "",
    response_model=list[UserResponse],
)
def get_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = UserService(db)
    return service.get_users(skip=skip, limit=limit)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = UserService(db)
    return service.create_user(user_data)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = UserService(db)
    return service.get_user_by_id(user_id)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    service = UserService(db)
    return service.update_user(user_id, user_data)