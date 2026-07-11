import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.modules.courses.schemas import CourseResponse
from app.modules.users.schemas import UserResponse


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


class AdminEnrollmentCreate(BaseModel):
    course_id: uuid.UUID
    email: EmailStr
    # Requeridos solo cuando el correo no corresponde a un usuario existente;
    # el service decide si se crea un estudiante nuevo o se reutiliza uno.
    first_name: str | None = Field(None, min_length=2, max_length=100)
    last_name: str | None = Field(None, min_length=2, max_length=100)

    @model_validator(mode="after")
    def validate_new_user_fields(self) -> "AdminEnrollmentCreate":
        if (self.first_name is None) != (self.last_name is None):
            raise ValueError(
                "Debe indicar nombre y apellido para crear un usuario nuevo"
            )
        return self


class AdminEnrollmentResult(BaseModel):
    enrollment: EnrollmentResponse
    user: UserResponse
    user_created: bool


class AdminEnrollmentItem(BaseModel):
    id: uuid.UUID
    created_at: datetime
    student: UserResponse
    course: CourseResponse

    model_config = {
        "from_attributes": True
    }


class UserLookupResponse(BaseModel):
    exists: bool
    user: UserResponse | None = None


class CourseStudentItem(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    enrolled_at: datetime
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
