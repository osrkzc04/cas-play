import uuid
from datetime import datetime

from pydantic import BaseModel

from app.shared.enums import MaterialType


class MaterialResponse(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    original_name: str
    material_type: MaterialType
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
