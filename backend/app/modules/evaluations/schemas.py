import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.shared.enums import AttemptStatus, QuestionType


# ----------------------------------------------------------------------------
# Gestión (ADMIN / INSTRUCTOR)
# ----------------------------------------------------------------------------

class EvaluationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)


class EvaluationUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)


class OptionCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = False


class QuestionCreate(BaseModel):
    statement: str = Field(..., min_length=1)
    question_type: QuestionType
    options: list[OptionCreate] = Field(..., min_length=2, max_length=6)


class QuestionUpdate(BaseModel):
    statement: str | None = Field(None, min_length=1)
    question_type: QuestionType | None = None
    # Si se envían opciones, reemplazan por completo a las anteriores.
    options: list[OptionCreate] | None = Field(None, min_length=2, max_length=6)


class OptionResponse(BaseModel):
    id: uuid.UUID
    text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuestionResponse(BaseModel):
    id: uuid.UUID
    statement: str
    question_type: QuestionType
    options: list[OptionResponse]

    model_config = {"from_attributes": True}


class EvaluationResponse(BaseModel):
    id: uuid.UUID
    module_id: uuid.UUID
    title: str
    description: str | None
    question_count: int
    # La evaluación está lista para rendirse cuando el banco está completo (BR-021).
    is_ready: bool
    created_at: datetime
    updated_at: datetime


class EvaluationDetailResponse(EvaluationResponse):
    questions: list[QuestionResponse]


# ----------------------------------------------------------------------------
# Estudiante (rendir la evaluación)
# ----------------------------------------------------------------------------

class OptionPublic(BaseModel):
    id: uuid.UUID
    text: str

    model_config = {"from_attributes": True}


class QuestionPublic(BaseModel):
    id: uuid.UUID
    statement: str
    question_type: QuestionType
    options: list[OptionPublic]

    model_config = {"from_attributes": True}


class AnswerSubmit(BaseModel):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID | None = None


class AttemptSubmit(BaseModel):
    answers: list[AnswerSubmit] = Field(default_factory=list)


class AnswerResult(BaseModel):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID | None
    correct_option_id: uuid.UUID
    is_correct: bool


class AttemptDetailResponse(BaseModel):
    id: uuid.UUID
    evaluation_id: uuid.UUID
    attempt_number: int
    status: AttemptStatus
    score: float | None
    passed: bool | None
    total_questions: int
    correct_count: int | None
    # Las 10 preguntas fijadas para este intento (sin revelar la opción correcta).
    questions: list[QuestionPublic]
    # Resultados por pregunta; solo se exponen una vez enviado el intento.
    answers: list[AnswerResult]


class AttemptSummary(BaseModel):
    id: uuid.UUID
    attempt_number: int
    status: AttemptStatus
    score: float | None
    passed: bool | None
    created_at: datetime
    submitted_at: datetime | None
