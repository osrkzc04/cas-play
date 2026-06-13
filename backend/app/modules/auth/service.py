import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.core.security import get_password_hash, verify_password
from app.modules.audit.service import AuditService
from app.modules.auth.repository import (
    PasswordResetTokenRepository,
    RefreshTokenRepository,
)
from app.modules.auth.schemas import LoginRequest, PasswordResetConfirm
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.enums import AuditAction


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)
        self.refresh_token_repository = RefreshTokenRepository(db)
        self.password_reset_token_repository = PasswordResetTokenRepository(db)
        self.audit = AuditService(db)

    def login(self, login_data: LoginRequest) -> dict[str, str]:
        user = self.user_repository.get_by_email(login_data.email)

        if user is None:
            self.audit.record(
                action=AuditAction.LOGIN_FAILED,
                entity_type="user",
                details={"email": login_data.email, "reason": "user_not_found"},
            )
            raise UnauthorizedException("Correo o contraseña incorrectos")

        if not verify_password(login_data.password, user.password_hash):
            self.audit.record(
                action=AuditAction.LOGIN_FAILED,
                actor_id=user.id,
                entity_type="user",
                entity_id=user.id,
                details={"email": login_data.email, "reason": "invalid_password"},
            )
            raise UnauthorizedException("Correo o contraseña incorrectos")

        if not user.is_active:
            self.audit.record(
                action=AuditAction.LOGIN_FAILED,
                actor_id=user.id,
                entity_type="user",
                entity_id=user.id,
                details={"email": login_data.email, "reason": "inactive"},
            )
            raise UnauthorizedException("El usuario se encuentra inactivo")

        access_token = create_access_token(
            subject=user.id,
            extra_claims={
                "role": user.role.name,
                "email": user.email,
            },
        )

        refresh_token, expires_at = create_refresh_token(user.id)

        self.refresh_token_repository.create(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
        )

        self.audit.record(
            action=AuditAction.LOGIN,
            actor_id=user.id,
            entity_type="user",
            entity_id=user.id,
            details={"email": user.email},
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def refresh_access_token(self, refresh_token: str) -> dict[str, str]:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise UnauthorizedException("Token inválido o expirado") from exc

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Token inválido")

        stored_token = self.refresh_token_repository.get_active_by_token(
            refresh_token
        )

        if stored_token is None:
            raise UnauthorizedException("La sesión no se encuentra activa")

        user = self.user_repository.get_by_id(stored_token.user_id)

        if user is None or not user.is_active:
            raise UnauthorizedException("Usuario no autorizado")

        access_token = create_access_token(
            subject=user.id,
            extra_claims={
                "role": user.role.name,
                "email": user.email,
            },
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def logout(self, refresh_token: str) -> None:
        stored_token = self.refresh_token_repository.get_active_by_token(
            refresh_token
        )

        if stored_token is None:
            raise BadRequestException("La sesión ya no se encuentra activa")

        self.refresh_token_repository.revoke(stored_token)

    def request_password_reset(self, email: str) -> str:
        user = self.user_repository.get_by_email(email)

        if user is None:
            return "Si el correo existe, se enviarán instrucciones de recuperación"

        token = secrets.token_urlsafe(48)

        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )

        self.password_reset_token_repository.create(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )

        # Más adelante aquí enviaremos el token por correo.
        return token

    def confirm_password_reset(
        self,
        reset_data: PasswordResetConfirm,
    ) -> None:
        stored_token = self.password_reset_token_repository.get_active_by_token(
            reset_data.token
        )

        if stored_token is None:
            raise BadRequestException("El token de recuperación es inválido o expiró")

        user = self.user_repository.get_by_id(stored_token.user_id)

        if user is None:
            raise BadRequestException("No se pudo restablecer la contraseña")

        user.password_hash = get_password_hash(reset_data.new_password)

        self.db.commit()

        self.password_reset_token_repository.mark_as_used(stored_token)

        self.refresh_token_repository.revoke_all_by_user_id(user.id)

        self.audit.record(
            action=AuditAction.PASSWORD_CHANGED,
            actor_id=user.id,
            entity_type="user",
            entity_id=user.id,
        )