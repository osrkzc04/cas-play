import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel


class Rating(Base, BaseModel):
    __tablename__ = "ratings"

    # Existe una sola valoración por matrícula (BR-031).
    __table_args__ = (
        UniqueConstraint("enrollment_id", name="uq_rating_enrollment"),
        CheckConstraint("score >= 1 AND score <= 5", name="ck_rating_score_range"),
    )

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enrollments.id"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id"),
        nullable=False,
        index=True,
    )

    # Escala de 1 a 5 estrellas (BR-032).
    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # El comentario es opcional (BR-033).
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    user: Mapped["User"] = relationship()  # noqa: F821
    course: Mapped["Course"] = relationship()  # noqa: F821
