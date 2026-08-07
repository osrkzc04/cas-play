import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.base_model import BaseModel


class InstructorProfile(Base, BaseModel):
    __tablename__ = "instructor_profiles"

    # Perfil 1:1 con el usuario instructor. Se crea de forma perezosa la primera
    # vez que el instructor accede a su perfil, por eso la fila puede existir con
    # todos los campos vacíos.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    headline: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    specialty: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    about_me: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Ruta relativa de la foto en el almacenamiento local (ADR-008). La URL
    # pública se expone calculada en el schema de respuesta.
    photo_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Enlaces a redes sociales (linkedin, instagram, youtube) como documento JSON
    # para no crear una columna por red y poder ampliarlas sin migración.
    social_links: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    user: Mapped["User"] = relationship(  # noqa: F821
        back_populates="instructor_profile",
    )
