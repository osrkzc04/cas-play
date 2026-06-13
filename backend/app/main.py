from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.certificates.router import router as certificates_router
from app.modules.course_modules.router import router as modules_router
from app.modules.courses.router import router as courses_router
from app.modules.enrollments.router import router as enrollments_router
from app.modules.evaluations.router import router as evaluations_router
from app.modules.lessons.router import router as lessons_router
from app.modules.materials.router import router as materials_router
from app.modules.metrics.router import router as metrics_router
from app.modules.progress.router import router as progress_router
from app.modules.ratings.router import router as ratings_router
from app.modules.users.router import router as users_router


app = FastAPI(
    title=settings.PROJECT_NAME,
)


app.include_router(
    auth_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    users_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    courses_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    modules_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    lessons_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    materials_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    enrollments_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    progress_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    evaluations_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    certificates_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    ratings_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    audit_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    metrics_router,
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