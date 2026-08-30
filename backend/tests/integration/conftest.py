"""Infraestructura de las pruebas de integración (service -> repository -> PostgreSQL).

- Usa una base de datos dedicada (`cas_test`), nunca la de desarrollo. La URL se
  construye de forma explícita para no depender de `POSTGRES_DB` global.
- Cada test corre dentro de una transacción con savepoints y se revierte al
  final (rollback), de modo que los `commit()` de los repositorios quedan
  aislados y no contaminan otros tests.
- Los efectos externos se neutralizan: los correos ya son no-op
  (`EMAILS_ENABLED=False`) y `MEDIA_ROOT` apunta a un directorio temporal para
  el PDF de los certificados.
"""

import tempfile
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.jwt import create_access_token
from app.core.security import get_password_hash
from app.db import init_db  # noqa: F401  (registra todos los modelos en el metadata)
from app.db.base import Base
from app.modules.course_modules.schemas import ModuleCreate
from app.modules.course_modules.service import ModuleService
from app.modules.courses.schemas import CourseCreate
from app.modules.courses.service import CourseService
from app.modules.enrollments.service import EnrollmentService
from app.modules.evaluations.models import AnswerOption, Question
from app.modules.evaluations.schemas import (
    EvaluationCreate,
    OptionCreate,
    QuestionCreate,
)
from app.modules.evaluations.service import EvaluationService
from app.modules.lessons.schemas import LessonCreate
from app.modules.lessons.service import LessonService
from app.modules.progress.service import ProgressService
from app.modules.users.models import Role, User
from app.shared.enums import CourseStatus, QuestionType, RoleName

TEST_DB_NAME = "cas_test"
_TEST_DATABASE_URL = (
    f"postgresql+psycopg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{TEST_DB_NAME}"
)

engine = create_engine(_TEST_DATABASE_URL, pool_pre_ping=True)


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    # Esquema limpio para toda la sesión de pruebas + roles base persistidos.
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with Session(engine) as setup:
        for role in RoleName:
            exists = setup.scalar(select(Role).where(Role.name == role.value))
            if exists is None:
                setup.add(Role(name=role.value, description=role.value))
        setup.commit()

    # El PDF del certificado se escribe en un directorio temporal aislado.
    settings.MEDIA_ROOT = tempfile.mkdtemp(prefix="cas_test_media_")

    yield

    Base.metadata.drop_all(engine)


@pytest.fixture
def db(_prepare_database) -> Session:
    # Transacción externa por test; los commits de los repos usan savepoints y
    # todo se revierte al terminar, garantizando aislamiento entre casos.
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


# --------------------------------------------------------------------------- #
# Factories: crean datos base reutilizando los servicios reales cuando aporta,
# o el ORM directo para prerrequisitos simples.
# --------------------------------------------------------------------------- #


class Factory:
    def __init__(self, db: Session):
        self.db = db

    def _role(self, name: RoleName) -> Role:
        return self.db.scalar(select(Role).where(Role.name == name.value))

    def user(
        self,
        role: RoleName,
        *,
        email: str | None = None,
        password: str = "Passw0rd@",
        is_active: bool = True,
        first_name: str = "Test",
        last_name: str = "User",
    ) -> User:
        user = User(
            role_id=self._role(role).id,
            first_name=first_name,
            last_name=last_name,
            email=email or f"{role.value.lower()}-{uuid.uuid4().hex[:8]}@casplay.com",
            password_hash=get_password_hash(password),
            is_active=is_active,
            is_verified=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def admin(self, **kwargs) -> User:
        return self.user(RoleName.ADMIN, **kwargs)

    def instructor(self, **kwargs) -> User:
        return self.user(RoleName.INSTRUCTOR, **kwargs)

    def student(self, **kwargs) -> User:
        return self.user(RoleName.STUDENT, **kwargs)

    def course(self, instructor: User, *, published: bool = False, title: str = "Curso de prueba"):
        service = CourseService(self.db)
        course = service.create_course(CourseCreate(title=title), instructor)
        if published:
            course = service.publish_course(course.id, instructor)
        return course

    def lessons(self, course, instructor: User, count: int = 1, preview_first: bool = False):
        module = ModuleService(self.db).create_module(
            course.id, ModuleCreate(title="Módulo 1"), instructor
        )
        lesson_service = LessonService(self.db)
        created = []
        for index in range(count):
            lesson = lesson_service.create_lesson(
                module.id,
                LessonCreate(
                    title=f"Clase {index + 1}",
                    is_preview=preview_first and index == 0,
                ),
                instructor,
            )
            created.append(lesson)
        return module, created

    def enroll(self, student: User, course):
        return EnrollmentService(self.db).enroll(course.id, student)

    def evaluation_with_bank(self, course, instructor: User, size: int = 20):
        service = EvaluationService(self.db)
        evaluation = service.create_evaluation(
            course.id, EvaluationCreate(title="Evaluación final"), instructor
        )
        for index in range(size):
            service.add_question(
                evaluation.id,
                QuestionCreate(
                    statement=f"Pregunta {index + 1}",
                    question_type=QuestionType.MULTIPLE_CHOICE,
                    options=[
                        OptionCreate(text="Correcta", is_correct=True),
                        OptionCreate(text="Incorrecta", is_correct=False),
                    ],
                ),
                instructor,
            )
        return evaluation

    def correct_option_map(self, evaluation_id) -> dict:
        # Mapa question_id -> option_id correcto, para responder los intentos.
        rows = self.db.scalars(
            select(AnswerOption)
            .join(Question, AnswerOption.question_id == Question.id)
            .where(Question.evaluation_id == evaluation_id, AnswerOption.is_correct)
        ).all()
        return {row.question_id: row.id for row in rows}

    def complete_lessons(self, student: User, lessons, count: int):
        progress = ProgressService(self.db)
        for lesson in lessons[:count]:
            progress.complete_lesson(lesson.id, student)

    def access_token(self, user: User) -> str:
        return create_access_token(
            user.id, {"role": user.role.name, "email": user.email}
        )

    def bearer(self, user: User) -> dict:
        return {"Authorization": f"Bearer {self.access_token(user)}"}


@pytest.fixture
def factory(db: Session) -> Factory:
    return Factory(db)


@pytest.fixture
def client(db: Session) -> TestClient:
    # Cliente HTTP contra la app real; el override enruta get_db a la misma
    # sesión transaccional del test, de modo que los datos creados por las
    # factories son visibles para las peticiones y todo se revierte al final.
    from app.main import app
    from app.shared.dependencies import get_db

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
