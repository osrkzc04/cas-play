import uuid
from datetime import datetime

from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: uuid.UUID
    code: str
    course_id: uuid.UUID
    course_title: str
    student_name: str
    average_score: float
    issued_at: datetime
    pdf_available: bool
    created_at: datetime
    updated_at: datetime


class CertificateEligibilityResponse(BaseModel):
    course_id: uuid.UUID
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    # Promedio del curso sobre las evaluaciones rendidas; None si faltan evaluaciones.
    average_score: float | None
    passing_score: float
    is_progress_complete: bool
    are_evaluations_complete: bool
    is_eligible: bool
    already_issued: bool
    # Motivo por el que aún no se puede emitir; None cuando es elegible.
    reason: str | None


class CertificateVerificationResponse(BaseModel):
    # Vista pública de validación: confirma autenticidad sin exponer ids internos.
    is_valid: bool
    code: str
    student_name: str
    course_title: str
    issued_at: datetime
