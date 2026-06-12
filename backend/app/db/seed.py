from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.modules.users.models import Role, User
from app.shared.enums import RoleName


DEFAULT_ROLES = [
    {
        "name": RoleName.ADMIN.value,
        "description": "System administrator",
    },
    {
        "name": RoleName.INSTRUCTOR.value,
        "description": "Course instructor",
    },
    {
        "name": RoleName.STUDENT.value,
        "description": "Student user",
    },
]


def seed_roles(db: Session) -> None:
    for role_data in DEFAULT_ROLES:
        exists = db.query(Role).filter(Role.name == role_data["name"]).first()

        if not exists:
            db.add(Role(**role_data))

    db.commit()


def seed_admin(db: Session) -> None:
    existing_admin = (
        db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
    )

    if existing_admin is not None:
        return

    admin_role = (
        db.query(Role).filter(Role.name == RoleName.ADMIN.value).first()
    )

    # El rol ADMIN debe existir antes; seed_roles se ejecuta primero.
    if admin_role is None:
        raise RuntimeError("El rol ADMIN no existe. Ejecute seed_roles primero.")

    admin = User(
        role_id=admin_role.id,
        first_name=settings.FIRST_ADMIN_FIRST_NAME,
        last_name=settings.FIRST_ADMIN_LAST_NAME,
        email=settings.FIRST_ADMIN_EMAIL,
        password_hash=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
        is_active=True,
        is_verified=True,
    )

    db.add(admin)
    db.commit()