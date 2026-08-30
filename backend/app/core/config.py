import os
from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CAS Learning Platform API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Raíz de almacenamiento local de archivos (videos y materiales).
    # En despliegue se monta como volumen persistente (ADR-008).
    # Coincide con la convención de .gitignore: backend/storage/{videos,materials}.
    MEDIA_ROOT: str = "storage"
    MAX_VIDEO_SIZE_MB: int = 500
    MAX_MATERIAL_SIZE_MB: int = 25
    MAX_COVER_SIZE_MB: int = 5
    MAX_PROFILE_PHOTO_SIZE_MB: int = 2

    # Base pública del servidor; raíz para servir media (portadas de curso,
    # fotos de instructor) que el backend expone bajo /api/v1.
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # Base del frontend; usada para enlaces en correos (login de usuarios recién
    # creados) y para el QR de validación pública de certificados, que apunta a
    # la página /verify/:code del frontend (BR-030).
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Configuración de correo saliente (SMTP). Cuando EMAILS_ENABLED es False
    # (entorno local sin servidor SMTP) el envío se registra en log en vez de
    # despacharse, para no bloquear los flujos de negocio.
    EMAILS_ENABLED: bool = False
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@casplay.com"
    SMTP_FROM_NAME: str = "Culinary Arts School"
    SMTP_TLS: bool = True

    FIRST_ADMIN_EMAIL: str = "admin@casplay.com"
    FIRST_ADMIN_PASSWORD: str = "Admin12345"
    FIRST_ADMIN_FIRST_NAME: str = "Admin"
    FIRST_ADMIN_LAST_NAME: str = "CAS"

    # En local se lee `../.env.dev`; en despliegue (Docker/Dokploy) las variables
    # se inyectan en el entorno y tienen prioridad. ENV_FILE permite apuntar a
    # otro archivo sin tocar el código.
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", "../.env.dev"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+psycopg://"
            f"{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/"
            f"{self.POSTGRES_DB}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()