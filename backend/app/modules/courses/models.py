import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel
from app.shared.enums import CourseStatus


class Course(Base, BaseModel):
    __tablename__ = "courses"

    instructor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus, name="course_status"),
        nullable=False,
        default=CourseStatus.DRAFT,
    )

    instructor: Mapped["User"] = relationship()  # noqa: F821
