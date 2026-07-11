import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class RatingUpdate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class RatingResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    user_id: uuid.UUID
    score: int
    comment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CourseRatingSummary(BaseModel):
    course_id: uuid.UUID
    average: float | None
    total: int


class PublicRatingResponse(BaseModel):
    id: uuid.UUID
    score: int
    comment: str | None
    student_name: str
    created_at: datetime


class AdminRatingResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    course_title: str
    student_name: str
    score: int
    comment: str | None
    created_at: datetime
