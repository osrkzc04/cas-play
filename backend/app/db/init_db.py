# Este archivo centraliza la importación de modelos para Alembic.
# A medida que se creen módulos, se irán importando aquí.

# Ejemplo futuro:
# from app.modules.users.models import User, Role

from app.modules.auth.models import PasswordResetToken, RefreshToken  # noqa: F401
from app.modules.courses.models import Course  # noqa: F401
from app.modules.users.models import Role, User  # noqa: F401