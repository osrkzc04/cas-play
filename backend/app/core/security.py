import secrets
import string

from passlib.context import CryptContext


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# Alfabeto sin caracteres ambiguos (O/0, l/1) para contraseñas temporales que
# el usuario debe transcribir desde el correo de bienvenida.
_TEMP_PASSWORD_ALPHABET = (
    "ABCDEFGHJKLMNPQRSTUVWXYZ" "abcdefghijkmnpqrstuvwxyz" "23456789"
)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def generate_temporary_password(length: int = 12) -> str:
    return "".join(secrets.choice(_TEMP_PASSWORD_ALPHABET) for _ in range(length))