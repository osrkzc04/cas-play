"""Emula el correo de bienvenida que recibe un estudiante al ser matriculado.

No toca la base de datos: reutiliza las mismas funciones del flujo real
(generación de contraseña temporal + plantilla de bienvenida + envío SMTP) para
verificar la entrega y la maquetación del correo. Ejecutar desde `backend/`:

    python scripts/emulate_student_welcome_email.py oscarpgualoto@gmail.com
"""

import sys

from app.core.config import settings
from app.core.email import build_welcome_email, send_email
from app.core.security import generate_temporary_password


def main() -> None:
    to = sys.argv[1] if len(sys.argv) > 1 else "oscarpgualoto@gmail.com"
    first_name = sys.argv[2] if len(sys.argv) > 2 else "Oscar"

    temporary_password = generate_temporary_password()

    print(f"EMAILS_ENABLED={settings.EMAILS_ENABLED}")
    print(f"SMTP_HOST={settings.SMTP_HOST}:{settings.SMTP_PORT} TLS={settings.SMTP_TLS}")
    print(f"FROM={settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>")
    print(f"Enviando correo de bienvenida a {to} ...")

    send_email(
        to=to,
        subject="Acceso a la plataforma de Culinary Arts School",
        html_body=build_welcome_email(
            first_name=first_name,
            email=to,
            temporary_password=temporary_password,
        ),
    )

    print("OK: correo despachado.")
    print(f"Contraseña temporal generada (emulada): {temporary_password}")


if __name__ == "__main__":
    main()
