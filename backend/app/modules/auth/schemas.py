import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class AuthUserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    must_change_password: bool

    model_config = {
        "from_attributes": True
    }


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class TestEmailRequest(BaseModel):
    to: EmailStr
    template: Literal["welcome", "notification"] = "notification"


class RefreshTokenResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    expires_at: datetime
    revoked_at: datetime | None

    model_config = {
        "from_attributes": True
    }