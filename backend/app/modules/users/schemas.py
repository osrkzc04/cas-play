import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.shared.enums import RoleName


class RoleBase(BaseModel):
    name: RoleName
    description: str | None = None


class RoleCreate(RoleBase):
    pass


class RoleResponse(RoleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    # La contraseña no se solicita: el alta de personal (ADMIN/INSTRUCTOR) genera
    # una contraseña temporal que se envía por correo (BR-037).
    role_id: uuid.UUID


class UserUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=2, max_length=100)
    last_name: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    role_id: uuid.UUID | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class UserResponse(UserBase):
    id: uuid.UUID
    role_id: uuid.UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserWithRoleResponse(UserResponse):
    role: RoleResponse