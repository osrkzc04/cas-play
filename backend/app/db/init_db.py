# Este archivo centraliza la importación de modelos para Alembic.
# A medida que se creen módulos, se irán importando aquí.

# Ejemplo futuro:
# from app.modules.users.models import User, Role

from app.modules.auth.models import PasswordResetToken, RefreshToken  # noqa: F401
from app.modules.course_modules.models import Module  # noqa: F401
from app.modules.courses.models import Course  # noqa: F401
from app.modules.enrollments.models import Enrollment  # noqa: F401
from app.modules.evaluations.models import (  # noqa: F401
    AnswerOption,
    AttemptAnswer,
    Evaluation,
    EvaluationAttempt,
    Question,
)
from app.modules.lessons.models import Lesson  # noqa: F401
from app.modules.materials.models import SupplementalMaterial  # noqa: F401
from app.modules.progress.models import LessonProgress  # noqa: F401
from app.modules.users.models import Role, User  # noqa: F401