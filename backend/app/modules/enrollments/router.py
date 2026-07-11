import uuid

from fastapi import APIRouter, Depends, Query, status
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.modules.courses.dependencies import require_course_manager
from app.modules.enrollments.dependencies import require_student
from app.modules.enrollments.schemas import (
    AdminEnrollmentCreate,
    AdminEnrollmentItem,
    AdminEnrollmentResult,
    CourseStudentItem,
    EnrolledCourseResponse,
    EnrollmentResponse,
    EnrollmentStatusResponse,
    UserLookupResponse,
)
from app.modules.enrollments.service import EnrollmentService
from app.modules.users.dependencies import require_admin
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse
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


@router.get(
    "/courses/{course_id}/students",
    response_model=PaginatedResponse[CourseStudentItem],
)
def list_course_students(
    course_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EnrollmentService(db)
    return service.list_course_students(
        course_id=course_id,
        current_user=current_user,
        page=page,
        size=size,
    )


@router.post(
    "/admin/enrollments",
    response_model=AdminEnrollmentResult,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_enrollment(
    data: AdminEnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = EnrollmentService(db)
    enrollment, user, user_created = service.create_admin_enrollment(
        data, actor=current_user
    )

    return AdminEnrollmentResult(
        enrollment=EnrollmentResponse.model_validate(enrollment),
        user=UserResponse.model_validate(user),
        user_created=user_created,
    )


@router.get(
    "/admin/enrollments",
    response_model=PaginatedResponse[AdminEnrollmentItem],
)
def list_admin_enrollments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    course_id: uuid.UUID | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = EnrollmentService(db)
    return service.list_admin_enrollments(page=page, size=size, course_id=course_id)


@router.get(
    "/admin/users/lookup",
    response_model=UserLookupResponse,
)
def lookup_user_by_email(
    email: EmailStr = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = EnrollmentService(db)
    user = service.lookup_user_by_email(email)

    return UserLookupResponse(
        exists=user is not None,
        user=UserResponse.model_validate(user) if user is not None else None,
    )
