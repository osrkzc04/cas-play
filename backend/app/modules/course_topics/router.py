import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.course_topics.schemas import (
    CourseTopicReplace,
    CourseTopicResponse,
)
from app.modules.course_topics.service import CourseTopicService
from app.modules.courses.dependencies import require_course_manager
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(
    tags=["Course topics"],
)


@router.get(
    "/courses/{course_id}/topics",
    response_model=list[CourseTopicResponse],
)
def list_course_topics(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseTopicService(db)
    return service.list_topics(course_id, current_user)


@router.put(
    "/courses/{course_id}/topics",
    response_model=list[CourseTopicResponse],
)
def replace_course_topics(
    course_id: uuid.UUID,
    data: CourseTopicReplace,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = CourseTopicService(db)
    return service.replace_topics(course_id, data, current_user)
