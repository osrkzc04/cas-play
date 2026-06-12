import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LessonBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)
    is_preview: bool = False


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)
    is_preview: bool | None = None


class LessonReorder(BaseModel):
    # Lista ordenada con la totalidad de las clases del módulo.
    lesson_ids: list[uuid.UUID] = Field(..., min_length=1)


class LessonResponse(LessonBase):
    id: uuid.UUID
    module_id: uuid.UUID
    position: int
    has_video: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
