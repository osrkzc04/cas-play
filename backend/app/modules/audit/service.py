import math
import uuid

from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditLogResponse
from app.shared.enums import AuditAction
from app.shared.pagination import PaginatedResponse


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.audit_repository = AuditRepository(db)

    def record(
        self,
        action: AuditAction,
        actor_id: uuid.UUID | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> AuditLog | None:
        # La auditoría es una operación secundaria: nunca debe interrumpir la
        # acción principal del usuario si el registro falla.
        try:
            return self.audit_repository.create(
                action=action,
                actor_id=actor_id,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
            )
        except Exception:
            self.db.rollback()
            return None

    def list_logs(
        self,
        action: AuditAction | None,
        actor_id: uuid.UUID | None,
        page: int,
        size: int,
    ) -> PaginatedResponse[AuditLogResponse]:
        skip = (page - 1) * size

        items = self.audit_repository.list(
            action=action,
            actor_id=actor_id,
            skip=skip,
            limit=size,
        )
        total = self.audit_repository.count(action=action, actor_id=actor_id)

        return PaginatedResponse(
            items=[AuditLogResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            size=size,
            pages=math.ceil(total / size) if total else 0,
        )
