import re

from app.core.exceptions import BadRequestException

# Política de contraseñas segura, compartida por el cambio y el restablecimiento
# de contraseña. Debe mantenerse sincronizada con el frontend
# (frontend/src/modules/auth/schemas/passwordPolicy.ts).
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
# Se admite cualquier símbolo (carácter no alfanumérico, excluyendo espacios); no
# se limita a un conjunto fijo. El hint solo orienta con ejemplos al usuario.
PASSWORD_SPECIAL_HINT = "@ # $ % & * ! ? . -"

_SPECIAL_PATTERN = re.compile(r"[^A-Za-z0-9\s]")


def validate_password_strength(password: str) -> None:
    """Valida la robustez de una contraseña elegida por el usuario.

    Se ejecuta como red de seguridad del backend: el frontend valida los mismos
    criterios antes de enviar. Lanza BadRequestException (400) con un mensaje en
    español que enumera los requisitos incumplidos.
    """
    missing: list[str] = []

    if len(password) < PASSWORD_MIN_LENGTH:
        missing.append(f"al menos {PASSWORD_MIN_LENGTH} caracteres")
    if not re.search(r"[A-Z]", password):
        missing.append("una letra mayúscula")
    if not re.search(r"[a-z]", password):
        missing.append("una letra minúscula")
    if not re.search(r"[0-9]", password):
        missing.append("un número")
    if not _SPECIAL_PATTERN.search(password):
        missing.append(f"un símbolo (p. ej. {PASSWORD_SPECIAL_HINT})")

    if missing:
        raise BadRequestException(
            "La contraseña debe incluir " + ", ".join(missing) + "."
        )
