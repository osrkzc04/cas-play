import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LastSecondUpdate(BaseModel):
    last_second: int = Field(ge=0)


class LessonProgressResponse(BaseModel):
    lesson_id: uuid.UUID
    last_second: int
    is_completed: bool
    completed_at: datetime | None

    model_config = {
        "from_attributes": True
    }


class CourseProgressResponse(BaseModel):
    course_id: uuid.UUID
    total_lessons: int
    completed_lessons: int
    percentage: float
    lessons: list[LessonProgressResponse]
