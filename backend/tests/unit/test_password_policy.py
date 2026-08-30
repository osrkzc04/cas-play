"""Unitarios de la política de contraseñas (BR-041).

Objetivo real: app.shared.password.validate_password_strength.
Función pura (sin BD): valida longitud, mayúscula, minúscula, número y símbolo.
"""

import pytest

from app.core.exceptions import BadRequestException
from app.shared.password import (
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    validate_password_strength,
)

# Contraseña base que cumple todos los criterios; cada caso negativo rompe uno.
VALID_PASSWORD = "Abcdef1@"


def test_valid_password_passes():
    # No debe lanzar excepción cuando cumple todos los criterios.
    validate_password_strength(VALID_PASSWORD)


def test_min_length_boundary_is_accepted():
    # Exactamente PASSWORD_MIN_LENGTH caracteres es válido (límite inferior).
    assert len(VALID_PASSWORD) == PASSWORD_MIN_LENGTH
    validate_password_strength(VALID_PASSWORD)


def test_max_length_boundary_is_accepted():
    # 128 caracteres cumpliendo criterios es válido (límite superior).
    password = "A1@" + "a" * (PASSWORD_MAX_LENGTH - 3)
    assert len(password) == PASSWORD_MAX_LENGTH
    validate_password_strength(password)


@pytest.mark.parametrize(
    "password, expected_fragment",
    [
        ("Ab1@", f"al menos {PASSWORD_MIN_LENGTH} caracteres"),  # muy corta
        ("abcdef1@", "una letra mayúscula"),
        ("ABCDEF1@", "una letra minúscula"),
        ("Abcdefg@", "un número"),
        ("Abcdefg1", "un símbolo"),
    ],
)
def test_missing_criteria_raise(password, expected_fragment):
    with pytest.raises(BadRequestException) as exc:
        validate_password_strength(password)
    assert expected_fragment in str(exc.value.detail)


def test_message_concatenates_all_missing_criteria():
    # Una contraseña que incumple varios criterios los enumera todos juntos.
    with pytest.raises(BadRequestException) as exc:
        validate_password_strength("abc")

    detail = str(exc.value.detail)
    assert f"al menos {PASSWORD_MIN_LENGTH} caracteres" in detail
    assert "una letra mayúscula" in detail
    assert "un número" in detail
    assert "un símbolo" in detail
