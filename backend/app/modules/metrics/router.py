from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.metrics.dependencies import (
    require_admin,
    require_instructor,
    require_student,
)
from app.modules.metrics.schemas import (
    AdminMetricsResponse,
    InstructorMetricsResponse,
    StudentMetricsResponse,
)
from app.modules.metrics.service import MetricsService
from app.modules.users.models import User
from app.shared.dependencies import get_db


router = APIRouter(
    prefix="/metrics",
    tags=["Metrics"],
)


@router.get(
    "/admin",
    response_model=AdminMetricsResponse,
)
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return MetricsService(db).get_admin_metrics()


@router.get(
    "/instructor",
    response_model=InstructorMetricsResponse,
)
def get_instructor_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    return MetricsService(db).get_instructor_metrics(current_user)


@router.get(
    "/student",
    response_model=StudentMetricsResponse,
)
def get_student_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return MetricsService(db).get_student_metrics(current_user)
