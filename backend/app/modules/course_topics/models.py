import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel


class CourseTopic(Base, BaseModel):
    __tablename__ = "course_topics"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    content: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    # Posición 1..N dentro del curso; define el orden del temario informativo.
    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    course: Mapped["Course"] = relationship(back_populates="topics")  # noqa: F821
