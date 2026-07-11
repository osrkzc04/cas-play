import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel
from app.shared.enums import CourseLevel, CourseStatus


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

    # Resumen corto orientado a la tarjeta del catálogo; la descripción larga
    # admite texto extenso para la página de detalle del curso.
    summary: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    level: Mapped[CourseLevel | None] = mapped_column(
        Enum(CourseLevel, name="course_level"),
        nullable=True,
    )

    # Ruta relativa de la portada en el almacenamiento local (ADR-008). La URL
    # pública se expone calculada en el schema de respuesta.
    cover_image_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    duration_hours: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    target_audience: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus, name="course_status"),
        nullable=False,
        default=CourseStatus.DRAFT,
    )

    instructor: Mapped["User"] = relationship()  # noqa: F821

    # Temario informativo mostrado antes de inscribirse. Se borra en cascada
    # junto con el curso y se ordena por posición.
    topics: Mapped[list["CourseTopic"]] = relationship(  # noqa: F821
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="CourseTopic.position",
    )
