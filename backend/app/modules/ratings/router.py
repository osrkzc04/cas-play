import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.modules.ratings.dependencies import require_student
from app.modules.ratings.schemas import (
    CourseRatingSummary,
    PublicRatingResponse,
    RatingCreate,
    RatingResponse,
    RatingUpdate,
)
from app.modules.ratings.service import RatingService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.pagination import PaginatedResponse


router = APIRouter(tags=["Ratings"])


@router.post(
    "/courses/{course_id}/rating",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def rate_course(
    course_id: uuid.UUID,
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = RatingService(db)
    return service.rate_course(course_id, payload, current_user)


@router.put(
    "/courses/{course_id}/rating",
    response_model=RatingResponse,
)
def update_course_rating(
    course_id: uuid.UUID,
    payload: RatingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = RatingService(db)
    return service.update_my_rating(course_id, payload, current_user)


@router.get(
    "/courses/{course_id}/ratings",
    response_model=PaginatedResponse[PublicRatingResponse],
)
def list_course_ratings(
    course_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = RatingService(db)
    return service.list_course_ratings(course_id=course_id, page=page, size=size)


@router.get(
    "/courses/{course_id}/ratings/summary",
    response_model=CourseRatingSummary,
)
def get_course_rating_summary(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    service = RatingService(db)
    return service.get_course_summary(course_id)
