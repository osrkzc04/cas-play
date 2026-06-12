import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.modules.enrollments.dependencies import require_student
from app.modules.enrollments.schemas import (
    EnrolledCourseResponse,
    EnrollmentResponse,
    EnrollmentStatusResponse,
)
from app.modules.enrollments.service import EnrollmentService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.pagination import PaginatedResponse


router = APIRouter(tags=["Enrollments"])


@router.post(
    "/courses/{course_id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_in_course(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EnrollmentService(db)
    return service.enroll(course_id, current_user)


@router.get(
    "/courses/{course_id}/enrollment",
    response_model=EnrollmentStatusResponse,
)
def get_enrollment_status(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EnrollmentService(db)
    return EnrollmentStatusResponse(
        is_enrolled=service.is_enrolled(current_user.id, course_id)
    )


@router.get(
    "/enrollments/me",
    response_model=PaginatedResponse[EnrolledCourseResponse],
)
def list_my_enrollments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EnrollmentService(db)
    return service.list_my_courses(current_user=current_user, page=page, size=size)
