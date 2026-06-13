import uuid

from pydantic import BaseModel

from app.shared.enums import CourseStatus


class UserCountsResponse(BaseModel):
    total: int
    admins: int
    instructors: int
    students: int
    active: int


class CourseStatusCountsResponse(BaseModel):
    total: int
    draft: int
    published: int
    hidden: int
    finished: int


class AdminCourseRow(BaseModel):
    course_id: uuid.UUID
    title: str
    status: CourseStatus
    enrollments: int
    certificates: int
    average_rating: float | None


class AdminMetricsResponse(BaseModel):
    users: UserCountsResponse
    courses: CourseStatusCountsResponse
    enrollments_total: int
    certificates_total: int
    top_courses: list[AdminCourseRow]


class InstructorCourseRow(BaseModel):
    course_id: uuid.UUID
    title: str
    status: CourseStatus
    enrollments: int
    certificates: int
    ratings_count: int
    average_rating: float | None


class InstructorMetricsResponse(BaseModel):
    courses: CourseStatusCountsResponse
    enrollments_total: int
    certificates_total: int
    ratings_total: int
    average_rating: float | None
    courses_breakdown: list[InstructorCourseRow]


class StudentCourseRow(BaseModel):
    course_id: uuid.UUID
    title: str
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    has_certificate: bool


class StudentMetricsResponse(BaseModel):
    enrolled_courses: int
    completed_courses: int
    in_progress_courses: int
    certificates_earned: int
    courses_breakdown: list[StudentCourseRow]
