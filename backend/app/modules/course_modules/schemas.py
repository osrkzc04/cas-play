import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ModuleBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, max_length=5000)


class ModuleReorder(BaseModel):
    # Lista ordenada con la totalidad de los módulos del curso.
    module_ids: list[uuid.UUID] = Field(..., min_length=1)


class ModuleResponse(ModuleBase):
    id: uuid.UUID
    course_id: uuid.UUID
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
