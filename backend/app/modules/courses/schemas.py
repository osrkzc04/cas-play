import uuid
from datetime import datetime

from pydantic import BaseModel, Field, computed_field

from app.core.config import settings
from app.modules.course_topics.schemas import CourseTopicResponse
from app.shared.enums import CourseLevel, CourseStatus


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    summary: str | None = Field(None, max_length=300)
    description: str | None = Field(None, max_length=5000)
    level: CourseLevel | None = None
    duration_hours: int | None = Field(None, ge=0, le=1000)
    requirements: str | None = Field(None, max_length=5000)
    target_audience: str | None = Field(None, max_length=5000)


class CourseCreate(CourseBase):
    # Solo ADMIN puede fijar el instructor; para INSTRUCTOR se ignora y se usa el propio.
    instructor_id: uuid.UUID | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    summary: str | None = Field(None, max_length=300)
    description: str | None = Field(None, max_length=5000)
    level: CourseLevel | None = None
    duration_hours: int | None = Field(None, ge=0, le=1000)
    requirements: str | None = Field(None, max_length=5000)
    target_audience: str | None = Field(None, max_length=5000)
    # La reasignación de instructor solo la aplica ADMIN (validado en el service).
    instructor_id: uuid.UUID | None = None


class CourseResponse(CourseBase):
    id: uuid.UUID
    instructor_id: uuid.UUID
    # Ruta interna de almacenamiento; no se expone, solo alimenta cover_image_url.
    cover_image_path: str | None = Field(default=None, exclude=True)
    status: CourseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

    @computed_field
    @property
    def cover_image_url(self) -> str | None:
        # La portada se sirve por un endpoint público; el frontend la usa directo.
        if not self.cover_image_path:
            return None
        return (
            f"{settings.PUBLIC_BASE_URL}{settings.API_V1_PREFIX}"
            f"/courses/{self.id}/cover"
        )


class CourseDetailResponse(CourseResponse):
    # Incluye el temario informativo para la página de detalle.
    topics: list[CourseTopicResponse] = Field(default_factory=list)
