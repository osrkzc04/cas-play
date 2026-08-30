"""Integración — Gestión de usuarios (creación y actualización según roles)."""

import uuid

import pytest
from sqlalchemy import select

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.modules.users.models import Role
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.service import UserService
from app.shared.enums import RoleName


def _role_id(db, name: RoleName) -> uuid.UUID:
    return db.scalar(select(Role).where(Role.name == name.value)).id


def test_create_instructor_succeeds(db, factory):
    admin = factory.admin()
    service = UserService(db)

    user = service.create_user(
        UserCreate(
            first_name="Nuevo",
            last_name="Docente",
            email="nuevo.docente@casplay.com",
            role_id=_role_id(db, RoleName.INSTRUCTOR),
        ),
        actor=admin,
    )

    assert service.get_user_by_id(user.id).email == "nuevo.docente@casplay.com"


def test_create_student_role_is_rejected(db, factory):
    admin = factory.admin()
    with pytest.raises(BadRequestException):
        UserService(db).create_user(
            UserCreate(
                first_name="No",
                last_name="Permitido",
                email="alumno@casplay.com",
                role_id=_role_id(db, RoleName.STUDENT),
            ),
            actor=admin,
        )


def test_create_user_duplicate_email_conflicts(db, factory):
    admin = factory.admin()
    service = UserService(db)
    payload = UserCreate(
        first_name="Uno",
        last_name="Docente",
        email="dup@casplay.com",
        role_id=_role_id(db, RoleName.INSTRUCTOR),
    )
    service.create_user(payload, actor=admin)

    with pytest.raises(ConflictException):
        service.create_user(payload, actor=admin)


def test_create_user_unknown_role_not_found(db, factory):
    admin = factory.admin()
    with pytest.raises(NotFoundException):
        UserService(db).create_user(
            UserCreate(
                first_name="Sin",
                last_name="Rol",
                email="sinrol@casplay.com",
                role_id=uuid.uuid4(),
            ),
            actor=admin,
        )


def test_update_user_changes_data(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()

    updated = UserService(db).update_user(
        instructor.id, UserUpdate(first_name="Renombrado"), actor=admin
    )

    assert updated.first_name == "Renombrado"


def test_update_user_email_to_existing_conflicts(db, factory):
    admin = factory.admin()
    first = factory.instructor(email="ocupado@casplay.com")
    second = factory.instructor()

    with pytest.raises(ConflictException):
        UserService(db).update_user(
            second.id, UserUpdate(email=first.email), actor=admin
        )


def test_update_user_promote_to_student_is_rejected(db, factory):
    admin = factory.admin()
    instructor = factory.instructor()

    with pytest.raises(BadRequestException):
        UserService(db).update_user(
            instructor.id,
            UserUpdate(role_id=_role_id(db, RoleName.STUDENT)),
            actor=admin,
        )
