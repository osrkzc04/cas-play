import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.modules.ratings.models import Rating


class RatingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, rating_id: uuid.UUID) -> Rating | None:
        statement = select(Rating).where(Rating.id == rating_id)
        return self.db.scalar(statement)

    def get_by_enrollment(self, enrollment_id: uuid.UUID) -> Rating | None:
        statement = select(Rating).where(Rating.enrollment_id == enrollment_id)
        return self.db.scalar(statement)

    def create(
        self,
        enrollment_id: uuid.UUID,
        user_id: uuid.UUID,
        course_id: uuid.UUID,
        score: int,
        comment: str | None,
    ) -> Rating:
        rating = Rating(
            enrollment_id=enrollment_id,
            user_id=user_id,
            course_id=course_id,
            score=score,
            comment=comment,
        )

        self.db.add(rating)
        self.db.commit()
        self.db.refresh(rating)

        return rating

    def update(self, rating: Rating, score: int, comment: str | None) -> Rating:
        rating.score = score
        rating.comment = comment

        self.db.commit()
        self.db.refresh(rating)

        return rating

    def list_by_course(
        self,
        course_id: uuid.UUID,
        skip: int,
        limit: int,
    ) -> list[Rating]:
        statement = (
            select(Rating)
            .where(Rating.course_id == course_id)
            .options(joinedload(Rating.user))
            .order_by(Rating.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_by_course(self, course_id: uuid.UUID) -> int:
        statement = (
            select(func.count())
            .select_from(Rating)
            .where(Rating.course_id == course_id)
        )
        return self.db.scalar(statement) or 0

    def get_average(self, course_id: uuid.UUID) -> float | None:
        statement = select(func.avg(Rating.score)).where(Rating.course_id == course_id)
        average = self.db.scalar(statement)
        return float(average) if average is not None else None

    def aggregates_by_courses(
        self,
        course_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, tuple[float | None, int]]:
        # Promedio y cantidad de valoraciones por curso en una sola consulta,
        # para alimentar el catálogo sin incurrir en N+1.
        if not course_ids:
            return {}

        statement = (
            select(
                Rating.course_id,
                func.avg(Rating.score),
                func.count(),
            )
            .where(Rating.course_id.in_(course_ids))
            .group_by(Rating.course_id)
        )
        return {
            course_id: (float(average) if average is not None else None, count)
            for course_id, average, count in self.db.execute(statement).all()
        }

    def list_all(
        self,
        course_id: uuid.UUID | None,
        skip: int,
        limit: int,
    ) -> list[Rating]:
        statement = select(Rating).options(
            joinedload(Rating.user),
            joinedload(Rating.course),
        )
        if course_id is not None:
            statement = statement.where(Rating.course_id == course_id)
        statement = (
            statement.order_by(Rating.created_at.desc()).offset(skip).limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count_all(self, course_id: uuid.UUID | None) -> int:
        statement = select(func.count()).select_from(Rating)
        if course_id is not None:
            statement = statement.where(Rating.course_id == course_id)
        return self.db.scalar(statement) or 0

    def delete(self, rating: Rating) -> None:
        self.db.delete(rating)
        self.db.commit()
