import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CourseTopicItem(BaseModel):
    content: str = Field(..., min_length=3, max_length=300)


class CourseTopicReplace(BaseModel):
    # Reemplazo en bloque: la lista representa la totalidad del temario del
    # curso, en el orden deseado.
    items: list[CourseTopicItem] = Field(default_factory=list, max_length=100)


class CourseTopicResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    content: str
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
