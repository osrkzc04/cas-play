import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.progress.dependencies import require_student
from app.modules.progress.schemas import (
    CourseProgressResponse,
    LastSecondUpdate,
    LessonProgressResponse,
)
from app.modules.progress.service import ProgressService
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(tags=["Progress"])


@router.put(
    "/lessons/{lesson_id}/progress",
    response_model=LessonProgressResponse,
)
def save_lesson_progress(
    lesson_id: uuid.UUID,
    payload: LastSecondUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = ProgressService(db)
    return service.save_last_second(lesson_id, payload.last_second, current_user)


@router.post(
    "/lessons/{lesson_id}/progress/complete",
    response_model=LessonProgressResponse,
)
def complete_lesson(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = ProgressService(db)
    return service.complete_lesson(lesson_id, current_user)


@router.get(
    "/lessons/{lesson_id}/progress",
    response_model=LessonProgressResponse,
)
def get_lesson_progress(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = ProgressService(db)
    return service.get_lesson_progress(lesson_id, current_user)


@router.get(
    "/courses/{course_id}/progress",
    response_model=CourseProgressResponse,
)
def get_course_progress(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    service = ProgressService(db)
    return service.get_course_progress(course_id, current_user)
