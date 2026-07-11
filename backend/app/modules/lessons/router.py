import uuid

from fastapi import APIRouter, Depends, File, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import (
    get_optional_current_user_streaming,
)
from app.modules.courses.dependencies import require_course_manager
from app.modules.lessons.schemas import (
    LessonCreate,
    LessonReorder,
    LessonResponse,
    LessonUpdate,
)
from app.modules.lessons.service import LessonService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.media import stream_video_response
from app.shared.storage import resolve_path


router = APIRouter(
    tags=["Lessons"],
)


@router.post(
    "/modules/{module_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson(
    module_id: uuid.UUID,
    lesson_data: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.create_lesson(module_id, lesson_data, current_user)


@router.get(
    "/modules/{module_id}/lessons",
    response_model=list[LessonResponse],
)
def list_lessons(
    module_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.list_lessons(module_id, current_user)


@router.post(
    "/modules/{module_id}/lessons/reorder",
    response_model=list[LessonResponse],
)
def reorder_lessons(
    module_id: uuid.UUID,
    reorder_data: LessonReorder,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.reorder_lessons(module_id, reorder_data.lesson_ids, current_user)


@router.patch(
    "/lessons/{lesson_id}",
    response_model=LessonResponse,
)
def update_lesson(
    lesson_id: uuid.UUID,
    lesson_data: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.update_lesson(lesson_id, lesson_data, current_user)


@router.delete(
    "/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lesson(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    service.delete_lesson(lesson_id, current_user)


@router.put(
    "/lessons/{lesson_id}/video",
    response_model=LessonResponse,
)
def upload_lesson_video(
    lesson_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.set_video(lesson_id, file, current_user)


@router.delete(
    "/lessons/{lesson_id}/video",
    response_model=LessonResponse,
)
def delete_lesson_video(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = LessonService(db)
    return service.delete_video(lesson_id, current_user)


@router.get(
    "/lessons/{lesson_id}/video",
)
def stream_lesson_video(
    lesson_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user_streaming),
) -> Response:
    service = LessonService(db)
    lesson = service.get_lesson_for_video(lesson_id, current_user)
    return stream_video_response(
        resolve_path(lesson.video_path),
        request.headers.get("range"),
    )
