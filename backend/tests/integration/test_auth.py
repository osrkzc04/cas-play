"""Integración — Autenticación (inicio de sesión, renovación y cierre)."""

import pytest

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.modules.auth.schemas import LoginRequest
from app.modules.auth.service import AuthService

PASSWORD = "Passw0rd@"


def _login(db, email):
    return AuthService(db).login(LoginRequest(email=email, password=PASSWORD))


def test_login_success_returns_tokens(db, factory):
    user = factory.student(password=PASSWORD)

    tokens = _login(db, user.email)

    assert tokens["access_token"]
    assert tokens["refresh_token"]
    assert tokens["token_type"] == "bearer"


def test_login_unknown_email_fails(db, factory):
    with pytest.raises(UnauthorizedException):
        _login(db, "noexiste@casplay.com")


def test_login_wrong_password_fails(db, factory):
    user = factory.student(password=PASSWORD)
    with pytest.raises(UnauthorizedException):
        AuthService(db).login(LoginRequest(email=user.email, password="Otra1234@"))


def test_login_inactive_user_fails(db, factory):
    user = factory.student(password=PASSWORD, is_active=False)
    with pytest.raises(UnauthorizedException):
        _login(db, user.email)


def test_refresh_returns_new_access_token(db, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(db, user.email)

    refreshed = AuthService(db).refresh_access_token(tokens["refresh_token"])

    assert refreshed["access_token"]


def test_refresh_with_invalid_token_fails(db, factory):
    with pytest.raises(UnauthorizedException):
        AuthService(db).refresh_access_token("token-invalido")


def test_logout_revokes_active_session(db, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(db, user.email)

    AuthService(db).logout(tokens["refresh_token"])

    # Tras revocar, la renovación deja de ser válida.
    with pytest.raises(UnauthorizedException):
        AuthService(db).refresh_access_token(tokens["refresh_token"])


def test_logout_on_inactive_session_fails(db, factory):
    user = factory.student(password=PASSWORD)
    tokens = _login(db, user.email)
    AuthService(db).logout(tokens["refresh_token"])

    with pytest.raises(BadRequestException):
        AuthService(db).logout(tokens["refresh_token"])
