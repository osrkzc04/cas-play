from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.jwt import decode_token
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.dependencies import get_db


bearer_scheme = HTTPBearer()
optional_bearer_scheme = HTTPBearer(auto_error=False)


def _resolve_user_from_token(token: str, db: Session) -> User:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise UnauthorizedException("Token inválido o expirado") from exc

    if payload.get("type") != "access":
        raise UnauthorizedException("Token inválido")

    user_id = payload.get("sub")

    if user_id is None:
        raise UnauthorizedException("Token inválido")

    user_repository = UserRepository(db)
    user = user_repository.get_by_id(user_id)

    if user is None:
        raise UnauthorizedException("Usuario no autorizado")

    if not user.is_active:
        raise UnauthorizedException("El usuario se encuentra inactivo")

    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    return _resolve_user_from_token(credentials.credentials, db)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    # Permite endpoints accesibles tanto de forma anónima (vista previa)
    # como autenticada (gestores). Sin credenciales devuelve None.
    if credentials is None:
        return None

    return _resolve_user_from_token(credentials.credentials, db)


def require_roles(allowed_roles: list[str]):
    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.name not in allowed_roles:
            raise ForbiddenException(
                "No tiene permisos para realizar esta acción"
            )

        return current_user

    return role_checker