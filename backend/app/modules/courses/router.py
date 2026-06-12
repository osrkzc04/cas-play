import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.modules.courses.dependencies import require_course_manager
from app.modules.courses.schemas import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
)
from app.modules.courses.service import CourseService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.enums import CourseStatus
from app.shared.pagination import PaginatedResponse


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.create_course(course_data, current_user)


@router.get(
    "",
    response_model=PaginatedResponse[CourseResponse],
)
def list_published_courses(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = CourseService(db)
    return service.list_published(page=page, size=size)


@router.get(
    "/manage",
    response_model=PaginatedResponse[CourseResponse],
)
def list_managed_courses(
    course_status: CourseStatus | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.list_manage(
        current_user=current_user,
        status=course_status,
        page=page,
        size=size,
    )


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    service = CourseService(db)
    return service.get_public_course(course_id)


@router.patch(
    "/{course_id}",
    response_model=CourseResponse,
)
def update_course(
    course_id: uuid.UUID,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.update_course(course_id, course_data, current_user)


@router.post(
    "/{course_id}/publish",
    response_model=CourseResponse,
)
def publish_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.publish_course(course_id, current_user)


@router.post(
    "/{course_id}/hide",
    response_model=CourseResponse,
)
def hide_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.hide_course(course_id, current_user)


@router.post(
    "/{course_id}/finish",
    response_model=CourseResponse,
)
def finish_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseService(db)
    return service.finish_course(course_id, current_user)
