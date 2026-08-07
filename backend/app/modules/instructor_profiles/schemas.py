import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, computed_field

from app.core.config import settings


class SocialLinks(BaseModel):
    linkedin: HttpUrl | None = None
    instagram: HttpUrl | None = None
    youtube: HttpUrl | None = None


class InstructorProfileUpdate(BaseModel):
    headline: str | None = Field(None, max_length=150)
    specialty: str | None = Field(None, max_length=120)
    about_me: str | None = Field(None, max_length=2000)
    social_links: SocialLinks | None = None


def _photo_url(user_id: uuid.UUID, photo_path: str | None) -> str | None:
    # La foto se sirve por un endpoint público; el frontend la usa directo.
    if not photo_path:
        return None
    return (
        f"{settings.PUBLIC_BASE_URL}{settings.API_V1_PREFIX}"
        f"/instructors/{user_id}/photo"
    )


class InstructorProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    headline: str | None = None
    specialty: str | None = None
    about_me: str | None = None
    social_links: SocialLinks | None = None
    # Ruta interna de almacenamiento; no se expone, solo alimenta photo_url.
    photo_path: str | None = Field(default=None, exclude=True)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def photo_url(self) -> str | None:
        return _photo_url(self.user_id, self.photo_path)


class InstructorPublicResponse(BaseModel):
    # Perfil público mostrado en la página del curso. Combina datos del usuario
    # (nombre) con los del perfil (headline, especialidad, bio, redes, foto).
    user_id: uuid.UUID
    first_name: str
    last_name: str
    headline: str | None = None
    specialty: str | None = None
    about_me: str | None = None
    social_links: SocialLinks | None = None
    photo_url: str | None = None
