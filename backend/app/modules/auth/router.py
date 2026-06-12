from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import (
    AuthUserResponse,
    LoginRequest,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.responses import MessageResponse


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.login(login_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.refresh_access_token(token_data.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
)
def logout(
    logout_data: LogoutRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.logout(logout_data.refresh_token)

    return {
        "message": "Sesión cerrada correctamente"
    }


@router.get(
    "/me",
    response_model=AuthUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "role": current_user.role.name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
    }


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
def request_password_reset(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    result = service.request_password_reset(reset_data.email)

    # Temporalmente mostramos el token en desarrollo.
    # Cuando configuremos correo, esto debe cambiar.
    if result.startswith("Si el correo existe"):
        return {
            "message": result
        }

    return {
        "message": f"Token temporal de recuperación: {result}"
    }


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
)
def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.confirm_password_reset(reset_data)

    return {
        "message": "Contraseña actualizada correctamente"
    }