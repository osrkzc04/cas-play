import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel


class Lesson(Base, BaseModel):
    __tablename__ = "lessons"

    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
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

    # Posición 1..N dentro del módulo; define el orden de presentación.
    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Una clase de vista previa es accesible sin matrícula (BR-011).
    is_preview: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Ruta local del único video de la clase (BR-009). La carga se realiza
    # en un paso posterior, por eso es nullable.
    video_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    module: Mapped["Module"] = relationship()  # noqa: F821

    @property
    def has_video(self) -> bool:
        return self.video_path is not None
