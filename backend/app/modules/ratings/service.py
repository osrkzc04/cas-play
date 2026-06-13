import math
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.modules.courses.repository import CourseRepository
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.ratings.models import Rating
from app.modules.ratings.repository import RatingRepository
from app.modules.ratings.schemas import (
    CourseRatingSummary,
    PublicRatingResponse,
    RatingCreate,
    RatingResponse,
    RatingUpdate,
)
from app.modules.users.models import User
from app.shared.pagination import PaginatedResponse


class RatingService:
    def __init__(self, db: Session):
        self.rating_repository = RatingRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        self.course_repository = CourseRepository(db)

    def rate_course(
        self,
        course_id: uuid.UUID,
        payload: RatingCreate,
        current_user: User,
    ) -> RatingResponse:
        # Solo un estudiante matriculado puede valorar el curso (BR-031).
        enrollment = self.enrollment_repository.get_by_user_and_course(
            current_user.id, course_id
        )
        if enrollment is None:
            raise ForbiddenException("No está matriculado en este curso")

        if self.rating_repository.get_by_enrollment(enrollment.id) is not None:
            raise ConflictException("Ya valoró este curso")

        rating = self.rating_repository.create(
            enrollment_id=enrollment.id,
            user_id=current_user.id,
            course_id=course_id,
            score=payload.score,
            comment=payload.comment,
        )
        return RatingResponse.model_validate(rating)

    def update_my_rating(
        self,
        course_id: uuid.UUID,
        payload: RatingUpdate,
        current_user: User,
    ) -> RatingResponse:
        enrollment = self.enrollment_repository.get_by_user_and_course(
            current_user.id, course_id
        )
        if enrollment is None:
            raise ForbiddenException("No está matriculado en este curso")

        rating = self.rating_repository.get_by_enrollment(enrollment.id)
        if rating is None:
            raise NotFoundException("Aún no ha valorado este curso")

        rating = self.rating_repository.update(
            rating,
            score=payload.score,
            comment=payload.comment,
        )
        return RatingResponse.model_validate(rating)

    def get_course_summary(self, course_id: uuid.UUID) -> CourseRatingSummary:
        if self.course_repository.get_by_id(course_id) is None:
            raise NotFoundException("Curso no encontrado")

        return CourseRatingSummary(
            course_id=course_id,
            average=self.rating_repository.get_average(course_id),
            total=self.rating_repository.count_by_course(course_id),
        )

    def list_course_ratings(
        self,
        course_id: uuid.UUID,
        page: int,
        size: int,
    ) -> PaginatedResponse[PublicRatingResponse]:
        if self.course_repository.get_by_id(course_id) is None:
            raise NotFoundException("Curso no encontrado")

        skip = (page - 1) * size

        ratings = self.rating_repository.list_by_course(
            course_id=course_id,
            skip=skip,
            limit=size,
        )
        total = self.rating_repository.count_by_course(course_id)

        items = [self._to_public_response(rating) for rating in ratings]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def _to_public_response(self, rating: Rating) -> PublicRatingResponse:
        return PublicRatingResponse(
            id=rating.id,
            score=rating.score,
            comment=rating.comment,
            student_name=f"{rating.user.first_name} {rating.user.last_name}",
            created_at=rating.created_at,
        )
