import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.evaluations.dependencies import (
    require_course_manager,
    require_student,
)
from app.modules.evaluations.schemas import (
    AttemptDetailResponse,
    AttemptSubmit,
    AttemptSummary,
    EvaluationCreate,
    EvaluationDetailResponse,
    EvaluationResponse,
    EvaluationUpdate,
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
)
from app.modules.evaluations.service import EvaluationService
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(tags=["Evaluations"])


# --------------------------------------------------------------------------- #
# Gestión del banco de evaluaciones (ADMIN / INSTRUCTOR)
# --------------------------------------------------------------------------- #

@router.post(
    "/modules/{module_id}/evaluation",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_evaluation(
    module_id: uuid.UUID,
    payload: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.create_evaluation(module_id, payload, current_user)


@router.get(
    "/modules/{module_id}/evaluation",
    response_model=EvaluationDetailResponse,
)
def get_module_evaluation(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.get_evaluation_by_module(module_id, current_user)


@router.patch(
    "/evaluations/{evaluation_id}",
    response_model=EvaluationResponse,
)
def update_evaluation(
    evaluation_id: uuid.UUID,
    payload: EvaluationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.update_evaluation(evaluation_id, payload, current_user)


@router.delete(
    "/evaluations/{evaluation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_evaluation(
    evaluation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    service.delete_evaluation(evaluation_id, current_user)


@router.post(
    "/evaluations/{evaluation_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_question(
    evaluation_id: uuid.UUID,
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.add_question(evaluation_id, payload, current_user)


@router.get(
    "/evaluations/{evaluation_id}/questions",
    response_model=list[QuestionResponse],
)
def list_questions(
    evaluation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.list_questions(evaluation_id, current_user)


@router.patch(
    "/questions/{question_id}",
    response_model=QuestionResponse,
)
def update_question(
    question_id: uuid.UUID,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    return service.update_question(question_id, payload, current_user)


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_question(
    question_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = EvaluationService(db)
    service.delete_question(question_id, current_user)


# --------------------------------------------------------------------------- #
# Rendición de evaluaciones (STUDENT)
# --------------------------------------------------------------------------- #

@router.post(
    "/evaluations/{evaluation_id}/attempts",
    response_model=AttemptDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_attempt(
    evaluation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EvaluationService(db)
    return service.start_attempt(evaluation_id, current_user)


@router.get(
    "/evaluations/{evaluation_id}/attempts",
    response_model=list[AttemptSummary],
)
def list_my_attempts(
    evaluation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EvaluationService(db)
    return service.list_my_attempts(evaluation_id, current_user)


@router.post(
    "/attempts/{attempt_id}/submit",
    response_model=AttemptDetailResponse,
)
def submit_attempt(
    attempt_id: uuid.UUID,
    payload: AttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EvaluationService(db)
    return service.submit_attempt(attempt_id, payload, current_user)


@router.get(
    "/attempts/{attempt_id}",
    response_model=AttemptDetailResponse,
)
def get_attempt(
    attempt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = EvaluationService(db)
    return service.get_attempt(attempt_id, current_user)
