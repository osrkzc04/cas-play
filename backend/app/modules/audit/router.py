import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.modules.audit.dependencies import require_admin
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.enums import AuditAction
from app.shared.pagination import PaginatedResponse


router = APIRouter(
    prefix="/audit",
    tags=["Audit"],
)


@router.get(
    "/logs",
    response_model=PaginatedResponse[AuditLogResponse],
)
def list_audit_logs(
    action: AuditAction | None = Query(None),
    actor_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = AuditService(db)
    return service.list_logs(
        action=action,
        actor_id=actor_id,
        page=page,
        size=size,
    )
