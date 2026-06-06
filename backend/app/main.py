from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.modules.users.router import router as users_router


app = FastAPI(
    title=settings.PROJECT_NAME,
)


app.include_router(
    users_router,
    prefix=settings.API_V1_PREFIX,
)


@app.get(f"{settings.API_V1_PREFIX}/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@app.get(f"{settings.API_V1_PREFIX}/health/db")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }