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

    FIRST_ADMIN_EMAIL: str = "admin@casplay.com"
    FIRST_ADMIN_PASSWORD: str = "Admin12345"
    FIRST_ADMIN_FIRST_NAME: str = "Admin"
    FIRST_ADMIN_LAST_NAME: str = "CAS"

    model_config = SettingsConfigDict(
        env_file="../.env.dev",
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