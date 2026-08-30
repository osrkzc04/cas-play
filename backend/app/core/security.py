import secrets
import string

from passlib.context import CryptContext


# bcrypt trunca silenciosamente a 72 bytes; bcrypt_sha256 pre-hashea con
# HMAC-SHA256 y elimina ese límite, admitiendo el máximo de 128 caracteres de la
# política. Se conserva "bcrypt" como esquema legacy para verificar (y migrar vía
# needs_rehash) las contraseñas creadas antes de este cambio.
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
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


def needs_rehash(password_hash: str) -> bool:
    # True cuando el hash usa un esquema obsoleto (p. ej. bcrypt legacy) y debe
    # regenerarse con el esquema vigente tras una verificación exitosa.
    return pwd_context.needs_update(password_hash)


def generate_temporary_password(length: int = 12) -> str:
    return "".join(secrets.choice(_TEMP_PASSWORD_ALPHABET) for _ in range(length))