import uuid
from datetime import datetime

from pydantic import BaseModel

from app.shared.enums import AuditAction


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: AuditAction
    entity_type: str | None
    entity_id: uuid.UUID | None
    details: dict | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
