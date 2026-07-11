import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.base_model import BaseModel


class Certificate(Base, BaseModel):
    __tablename__ = "certificates"

    # Un único certificado por estudiante y curso.
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),
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

    # Código público de verificación; debe permanecer único (BR-028, BR-030).
    code: Mapped[str] = mapped_column(
        String(40),
        unique=True,
        nullable=False,
        index=True,
    )

    # Datos congelados al emitir: el certificado conserva su validez aunque el
    # curso cambie de estado o el usuario sea modificado (BR-029).
    student_name: Mapped[str] = mapped_column(
        String(201),
        nullable=False,
    )

    course_title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    # Nota de la evaluación final al momento de aprobar (sobre 10, BR-027).
    final_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    pdf_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
