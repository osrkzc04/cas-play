import uuid

from pydantic import BaseModel


class CurriculumLesson(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    position: int
    is_preview: bool
    has_video: bool

    model_config = {
        "from_attributes": True
    }


class CurriculumEvaluation(BaseModel):
    id: uuid.UUID
    title: str
    question_count: int
    # La evaluación solo se puede rendir cuando el banco está completo (BR-021).
    is_ready: bool


class CurriculumModule(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    position: int
    lessons: list[CurriculumLesson]


class CurriculumResponse(BaseModel):
    course_id: uuid.UUID
    modules: list[CurriculumModule]
    # Evaluación final única del curso; None mientras no exista (BR-020).
    final_evaluation: CurriculumEvaluation | None
