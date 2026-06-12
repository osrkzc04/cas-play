import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.shared.enums import CourseStatus


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)


class CourseCreate(CourseBase):
    # Solo ADMIN puede fijar el instructor; para INSTRUCTOR se ignora y se usa el propio.
    instructor_id: uuid.UUID | None = None


class CourseUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)
    # La reasignación de instructor solo la aplica ADMIN (validado en el service).
    instructor_id: uuid.UUID | None = None


class CourseResponse(CourseBase):
    id: uuid.UUID
    instructor_id: uuid.UUID
    status: CourseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
