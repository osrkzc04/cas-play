import uuid
from datetime import datetime

from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: uuid.UUID
    code: str
    course_id: uuid.UUID
    course_title: str
    student_name: str
    final_score: float
    issued_at: datetime
    pdf_available: bool
    created_at: datetime
    updated_at: datetime


class CertificateEligibilityResponse(BaseModel):
    course_id: uuid.UUID
    total_lessons: int
    completed_lessons: int
    # Avance del curso; debe llegar al 100% para poder emitir el certificado.
    progress_percentage: float
    # Nota de la evaluación final rendida; None si aún no la ha rendido.
    final_score: float | None
    passing_score: float
    # Indica si el curso ya tiene una evaluación final configurada.
    has_evaluation: bool
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
