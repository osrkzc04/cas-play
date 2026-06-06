from sqlalchemy.orm import Session

from app.modules.users.models import Role
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