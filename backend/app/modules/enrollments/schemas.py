import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.courses.schemas import CourseResponse


class EnrollmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    course_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class EnrolledCourseResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    course: CourseResponse

    model_config = {
        "from_attributes": True
    }


class EnrollmentStatusResponse(BaseModel):
    is_enrolled: bool
