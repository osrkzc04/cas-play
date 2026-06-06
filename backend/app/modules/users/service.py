import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import get_password_hash
from app.modules.users.models import Role, User
from app.modules.users.repository import RoleRepository, UserRepository
from app.modules.users.schemas import RoleCreate, UserCreate, UserUpdate


class RoleService:
    def __init__(self, db: Session):
        self.role_repository = RoleRepository(db)

    def get_roles(self) -> list[Role]:
        return self.role_repository.get_all()

    def get_role_by_id(self, role_id: uuid.UUID) -> Role:
        role = self.role_repository.get_by_id(role_id)

        if role is None:
            raise NotFoundException("Rol no encontrado")

        return role

    def create_role(self, role_data: RoleCreate) -> Role:
        existing_role = self.role_repository.get_by_name(role_data.name)

        if existing_role is not None:
            raise ConflictException("El rol ya existe")

        return self.role_repository.create(role_data)


class UserService:
    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)
        self.role_repository = RoleRepository(db)

    def get_users(self, skip: int = 0, limit: int = 10) -> list[User]:
        return self.user_repository.get_all(skip=skip, limit=limit)

    def get_user_by_id(self, user_id: uuid.UUID) -> User:
        user = self.user_repository.get_by_id(user_id)

        if user is None:
            raise NotFoundException("Usuario no encontrado")

        return user

    def create_user(self, user_data: UserCreate) -> User:
        existing_user = self.user_repository.get_by_email(user_data.email)

        if existing_user is not None:
            raise ConflictException(
                "Ya existe un usuario registrado con ese correo electrónico"
            )

        role = self.role_repository.get_by_id(user_data.role_id)

        if role is None:
            raise NotFoundException("Rol no encontrado")

        password_hash = get_password_hash(user_data.password)

        return self.user_repository.create(
            user_data=user_data,
            password_hash=password_hash,
        )

    def update_user(self, user_id: uuid.UUID, user_data: UserUpdate) -> User:
        user = self.get_user_by_id(user_id)

        if user_data.email and user_data.email != user.email:
            existing_user = self.user_repository.get_by_email(user_data.email)

            if existing_user is not None:
                raise ConflictException(
                    "Ya existe un usuario registrado con ese correo electrónico"
                )

        if user_data.role_id is not None:
            role = self.role_repository.get_by_id(user_data.role_id)

            if role is None:
                raise NotFoundException("Rol no encontrado")

        return self.user_repository.update(user, user_data)