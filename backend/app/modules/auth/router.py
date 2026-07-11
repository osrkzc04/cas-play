from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import (
    build_notification_email,
    build_welcome_email,
    send_email,
)
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.auth.schemas import (
    AuthUserResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    TestEmailRequest,
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
        "must_change_password": current_user.must_change_password,
    }


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    change_data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AuthService(db)
    service.change_password(current_user, change_data)

    return {
        "message": "Contraseña actualizada correctamente"
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
    service.request_password_reset(reset_data.email)

    return {
        "message": "Si el correo existe, se enviarán instrucciones de recuperación"
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


@router.post(
    "/test-email",
    response_model=MessageResponse,
)
def send_test_email(
    request: TestEmailRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    # Utilidad de diagnóstico (solo ADMIN) para validar la configuración SMTP y
    # la maquetación de las plantillas. Con EMAILS_ENABLED=False el envío solo se
    # registra en log (ver send_email).
    if request.template == "welcome":
        subject = "Prueba — Bienvenida a Culinary Arts School"
        html_body = build_welcome_email(
            first_name=current_user.first_name,
            email=str(request.to),
            temporary_password="Temporal123",
        )
    else:
        subject = "Prueba de notificación — Culinary Arts School"
        html_body = build_notification_email(
            title="Correo de prueba",
            message=(
                "Este es un correo de prueba enviado desde la plataforma de "
                "Culinary Arts School. Si lo recibes, la configuración de envío "
                "funciona correctamente."
            ),
            recipient_name=current_user.first_name,
            footer_note="Mensaje generado manualmente desde el panel de administración.",
        )

    send_email(to=str(request.to), subject=subject, html_body=html_body)

    delivery = "enviado" if settings.EMAILS_ENABLED else "registrado en log (SMTP deshabilitado)"
    return {
        "message": f"Correo de prueba {delivery} para {request.to}"
    }