import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.shared.enums import AuditAction


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        action: AuditAction,
        actor_id: uuid.UUID | None,
        entity_type: str | None,
        entity_id: uuid.UUID | None,
        details: dict | None,
    ) -> AuditLog:
        log = AuditLog(
            action=action,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )

        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)

        return log

    def _apply_filters(
        self,
        statement,
        action: AuditAction | None,
        actor_id: uuid.UUID | None,
    ):
        if action is not None:
            statement = statement.where(AuditLog.action == action)

        if actor_id is not None:
            statement = statement.where(AuditLog.actor_id == actor_id)

        return statement

    def list(
        self,
        action: AuditAction | None,
        actor_id: uuid.UUID | None,
        skip: int,
        limit: int,
    ) -> list[AuditLog]:
        statement = select(AuditLog)
        statement = self._apply_filters(statement, action, actor_id)
        statement = (
            statement.order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def count(
        self,
        action: AuditAction | None,
        actor_id: uuid.UUID | None,
    ) -> int:
        statement = select(func.count()).select_from(AuditLog)
        statement = self._apply_filters(statement, action, actor_id)
        return self.db.scalar(statement) or 0
