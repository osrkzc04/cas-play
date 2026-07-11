import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_user
from app.modules.curriculum.schemas import CurriculumResponse
from app.modules.curriculum.service import CurriculumService
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(
    tags=["Curriculum"],
)


@router.get(
    "/courses/{course_id}/curriculum",
    response_model=CurriculumResponse,
)
def get_curriculum(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CurriculumService(db)
    return service.get_curriculum(course_id, current_user)
