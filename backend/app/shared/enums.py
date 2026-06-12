from enum import Enum


class RoleName(str, Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    STUDENT = "STUDENT"


class CourseStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    HIDDEN = "HIDDEN"
    FINISHED = "FINISHED"


class MaterialType(str, Enum):
    PDF = "PDF"
    IMAGE = "IMAGE"
    OFFICE = "OFFICE"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"


class AttemptStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"


class AuditAction(str, Enum):
    LOGIN = "LOGIN"
    COURSE_CREATED = "COURSE_CREATED"
    COURSE_PUBLISHED = "COURSE_PUBLISHED"
    ENROLLMENT_CREATED = "ENROLLMENT_CREATED"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"