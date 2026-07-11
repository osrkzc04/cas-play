import uuid

from sqlalchemy.orm import Session

from app.core.email import build_welcome_email, send_email
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import generate_temporary_password, get_password_hash
from app.modules.audit.service import AuditService
from app.modules.users.models import Role, User
from app.modules.users.repository import RoleRepository, UserRepository
from app.modules.users.schemas import RoleCreate, UserCreate, UserUpdate
from app.shared.enums import AuditAction, RoleName


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
        self.audit = AuditService(db)

    def get_users(self, skip: int = 0, limit: int = 10) -> list[User]:
        return self.user_repository.get_all(skip=skip, limit=limit)

    def get_user_by_id(self, user_id: uuid.UUID) -> User:
        user = self.user_repository.get_by_id(user_id)

        if user is None:
            raise NotFoundException("Usuario no encontrado")

        return user

    def create_user(self, user_data: UserCreate, actor: User | None = None) -> User:
        existing_user = self.user_repository.get_by_email(user_data.email)

        if existing_user is not None:
            raise ConflictException(
                "Ya existe un usuario registrado con ese correo electrónico"
            )

        role = self.role_repository.get_by_id(user_data.role_id)

        if role is None:
            raise NotFoundException("Rol no encontrado")

        # BR-036: el alta de estudiantes no es directa; se realiza al matricular
        # para garantizar la contraseña temporal y el cambio obligatorio.
        if role.name == RoleName.STUDENT.value:
            raise BadRequestException(
                "Los estudiantes se crean al matricularlos en un curso, "
                "no desde la gestión de usuarios"
            )

        # BR-037: el personal (ADMIN/INSTRUCTOR) también recibe una contraseña
        # temporal por correo y debe cambiarla en su primer ingreso.
        temporary_password = generate_temporary_password()

        user = self.user_repository.create(
            user_data=user_data,
            password_hash=get_password_hash(temporary_password),
        )

        send_email(
            to=user.email,
            subject="Acceso a la plataforma de Culinary Arts School",
            html_body=build_welcome_email(
                first_name=user.first_name,
                email=user.email,
                temporary_password=temporary_password,
            ),
        )

        self.audit.record(
            action=AuditAction.USER_CREATED,
            actor_id=actor.id if actor else None,
            entity_type="user",
            entity_id=user.id,
            details={"email": user.email, "role": role.name},
        )

        return user

    def create_student_with_temp_password(
        self,
        first_name: str,
        last_name: str,
        email: str,
        actor: User | None = None,
    ) -> tuple[User, str]:
        # Onboarding administrativo: crea un estudiante con contraseña temporal
        # aleatoria. La contraseña en claro se devuelve para entregarla por
        # correo y nunca se persiste sin hashear.
        existing_user = self.user_repository.get_by_email(email)

        if existing_user is not None:
            raise ConflictException(
                "Ya existe un usuario registrado con ese correo electrónico"
            )

        role = self.role_repository.get_by_name(RoleName.STUDENT.value)

        if role is None:
            raise NotFoundException("Rol no encontrado")

        temporary_password = generate_temporary_password()

        user = self.user_repository.create_student(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=get_password_hash(temporary_password),
            role_id=role.id,
        )

        self.audit.record(
            action=AuditAction.USER_CREATED,
            actor_id=actor.id if actor else None,
            entity_type="user",
            entity_id=user.id,
            details={"email": email, "role": RoleName.STUDENT.value},
        )

        return user, temporary_password

    def update_user(
        self,
        user_id: uuid.UUID,
        user_data: UserUpdate,
        actor: User | None = None,
    ) -> User:
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

            # BR-036: no se puede convertir a un usuario en estudiante por esta
            # vía; los estudiantes provienen únicamente de la matrícula.
            if (
                role.name == RoleName.STUDENT.value
                and user.role.name != RoleName.STUDENT.value
            ):
                raise BadRequestException(
                    "No es posible asignar el rol de estudiante desde la "
                    "gestión de usuarios"
                )

        updated_user = self.user_repository.update(user, user_data)

        self.audit.record(
            action=AuditAction.USER_UPDATED,
            actor_id=actor.id if actor else None,
            entity_type="user",
            entity_id=updated_user.id,
            details=user_data.model_dump(
                mode="json", exclude_unset=True, exclude={"password"}
            ),
        )

        return updated_user