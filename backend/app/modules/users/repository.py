import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import Role, User
from app.modules.users.schemas import RoleCreate, UserCreate, UserUpdate


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: uuid.UUID) -> Role | None:
        statement = select(Role).where(Role.id == role_id)
        return self.db.scalar(statement)

    def get_by_name(self, name: str) -> Role | None:
        statement = select(Role).where(Role.name == name)
        return self.db.scalar(statement)

    def get_all(self) -> list[Role]:
        statement = select(Role).order_by(Role.name)
        return list(self.db.scalars(statement).all())

    def create(self, role_data: RoleCreate) -> Role:
        role = Role(**role_data.model_dump())

        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)

        return role


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        statement = select(User).where(User.id == user_id)
        return self.db.scalar(statement)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.db.scalar(statement)

    def get_all(self, skip: int = 0, limit: int = 10) -> list[User]:
        statement = (
            select(User)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(statement).all())

    def create(self, user_data: UserCreate, password_hash: str) -> User:
        data = user_data.model_dump(exclude={"password"})

        user = User(
            **data,
            password_hash=password_hash,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def update(self, user: User, user_data: UserUpdate) -> User:
        update_data = user_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)

        return user