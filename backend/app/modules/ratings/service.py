import math
import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.modules.courses.repository import CourseRepository
from app.modules.enrollments.repository import EnrollmentRepository
from app.modules.lessons.repository import LessonRepository
from app.modules.progress.repository import ProgressRepository
from app.modules.ratings.models import Rating
from app.modules.ratings.repository import RatingRepository
from app.modules.ratings.schemas import (
    AdminRatingResponse,
    CourseRatingSummary,
    PublicRatingResponse,
    RatingCreate,
    RatingResponse,
    RatingUpdate,
)
from app.modules.users.models import User
from app.shared.pagination import PaginatedResponse


class RatingService:
    # Avance mínimo del curso para habilitar la valoración (BR-031).
    RATING_MIN_PROGRESS = 90.0

    def __init__(self, db: Session):
        self.rating_repository = RatingRepository(db)
        self.enrollment_repository = EnrollmentRepository(db)
        self.course_repository = CourseRepository(db)
        self.progress_repository = ProgressRepository(db)
        self.lesson_repository = LessonRepository(db)

    def _course_progress_percentage(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> float:
        total_lessons = self.lesson_repository.count_by_course(course_id)
        if not total_lessons:
            return 0.0
        completed_lessons = self.progress_repository.count_completed_by_course(
            user_id, course_id
        )
        return round(completed_lessons / total_lessons * 100, 2)

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

        # Solo puede valorar quien completó la mayor parte del curso (BR-031).
        progress = self._course_progress_percentage(current_user.id, course_id)
        if progress < self.RATING_MIN_PROGRESS:
            raise ForbiddenException(
                f"Debe completar al menos el {self.RATING_MIN_PROGRESS:.0f}% "
                "del curso para valorarlo"
            )

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

    def get_my_rating(
        self,
        course_id: uuid.UUID,
        current_user: User,
    ) -> RatingResponse | None:
        enrollment = self.enrollment_repository.get_by_user_and_course(
            current_user.id, course_id
        )
        if enrollment is None:
            return None

        rating = self.rating_repository.get_by_enrollment(enrollment.id)
        if rating is None:
            return None

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

    # ------------------------------------------------------------------ #
    # Moderación (ADMIN)
    # ------------------------------------------------------------------ #

    def list_all_ratings(
        self,
        course_id: uuid.UUID | None,
        page: int,
        size: int,
    ) -> PaginatedResponse[AdminRatingResponse]:
        skip = (page - 1) * size

        ratings = self.rating_repository.list_all(
            course_id=course_id,
            skip=skip,
            limit=size,
        )
        total = self.rating_repository.count_all(course_id=course_id)

        items = [self._to_admin_response(rating) for rating in ratings]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )

    def delete_rating(self, rating_id: uuid.UUID) -> None:
        rating = self.rating_repository.get_by_id(rating_id)
        if rating is None:
            raise NotFoundException("Valoración no encontrada")
        self.rating_repository.delete(rating)

    def _to_admin_response(self, rating: Rating) -> AdminRatingResponse:
        return AdminRatingResponse(
            id=rating.id,
            course_id=rating.course_id,
            course_title=rating.course.title,
            student_name=f"{rating.user.first_name} {rating.user.last_name}",
            score=rating.score,
            comment=rating.comment,
            created_at=rating.created_at,
        )

    def _to_public_response(self, rating: Rating) -> PublicRatingResponse:
        return PublicRatingResponse(
            id=rating.id,
            score=rating.score,
            comment=rating.comment,
            student_name=f"{rating.user.first_name} {rating.user.last_name}",
            created_at=rating.created_at,
        )
