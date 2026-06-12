import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel
from app.shared.enums import MaterialType


class SupplementalMaterial(Base, BaseModel):
    __tablename__ = "supplemental_materials"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    original_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    material_type: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, name="material_type"),
        nullable=False,
    )

    lesson: Mapped["Lesson"] = relationship()  # noqa: F821
