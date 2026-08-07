import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.audit.service import AuditService
from app.modules.instructor_profiles.models import InstructorProfile
from app.modules.instructor_profiles.repository import InstructorProfileRepository
from app.modules.instructor_profiles.schemas import (
    InstructorProfileUpdate,
    InstructorPublicResponse,
    _photo_url,
)
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.enums import AuditAction, RoleName
from app.shared.storage import delete_file, save_upload

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class InstructorProfileService:
    def __init__(self, db: Session):
        self.profile_repository = InstructorProfileRepository(db)
        self.user_repository = UserRepository(db)
        self.audit = AuditService(db)

    def get_or_create(self, user: User) -> InstructorProfile:
        # El perfil se materializa perezosamente para que la respuesta siempre
        # tenga id y marcas de tiempo, aunque el instructor no lo haya editado.
        profile = self.profile_repository.get_by_user_id(user.id)

        if profile is None:
            profile = self.profile_repository.create(user.id)

        return profile

    def update_profile(
        self,
        user: User,
        data: InstructorProfileUpdate,
    ) -> InstructorProfile:
        profile = self.get_or_create(user)

        update_data = data.model_dump(exclude_unset=True)

        if "social_links" in update_data:
            # HttpUrl no es serializable en JSONB; se guarda como texto plano.
            links = data.social_links
            profile.social_links = (
                links.model_dump(mode="json") if links is not None else None
            )
            update_data.pop("social_links")

        for field, value in update_data.items():
            setattr(profile, field, value)

        saved = self.profile_repository.save(profile)

        self.audit.record(
            action=AuditAction.PROFILE_UPDATED,
            actor_id=user.id,
            entity_type="instructor_profile",
            entity_id=saved.id,
        )

        return saved

    def set_photo(self, user: User, upload: UploadFile) -> InstructorProfile:
        profile = self.get_or_create(user)

        extension = Path(upload.filename or "").suffix.lower()
        if extension not in ALLOWED_PHOTO_EXTENSIONS:
            raise BadRequestException("Formato de imagen no permitido")

        previous_path = profile.photo_path
        profile.photo_path = save_upload(
            upload,
            subdir="instructor-photos",
            max_bytes=settings.MAX_PROFILE_PHOTO_SIZE_MB * 1024 * 1024,
        )
        saved = self.profile_repository.save(profile)

        # Se elimina la foto anterior solo tras persistir la nueva.
        if previous_path:
            delete_file(previous_path)

        return saved

    def remove_photo(self, user: User) -> InstructorProfile:
        profile = self.get_or_create(user)

        if profile.photo_path is None:
            raise BadRequestException("El perfil no tiene una foto asignada")

        previous_path = profile.photo_path
        profile.photo_path = None
        saved = self.profile_repository.save(profile)
        delete_file(previous_path)

        return saved

    def _require_instructor(self, user_id: uuid.UUID) -> User:
        user = self.user_repository.get_by_id(user_id)

        if user is None or user.role.name != RoleName.INSTRUCTOR.value:
            raise NotFoundException("Instructor no encontrado")

        return user

    def get_public(self, user_id: uuid.UUID) -> InstructorPublicResponse:
        user = self._require_instructor(user_id)
        return self.build_public(user)

    @staticmethod
    def build_public(user: User) -> InstructorPublicResponse:
        # Combina el usuario con su perfil (si existe) en una vista pública única.
        profile = user.instructor_profile

        return InstructorPublicResponse(
            user_id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            headline=profile.headline if profile else None,
            specialty=profile.specialty if profile else None,
            about_me=profile.about_me if profile else None,
            social_links=profile.social_links if profile else None,
            photo_url=_photo_url(user.id, profile.photo_path) if profile else None,
        )

    def get_photo_path(self, user_id: uuid.UUID) -> str:
        user = self._require_instructor(user_id)
        profile = user.instructor_profile

        if profile is None or profile.photo_path is None:
            raise NotFoundException("Foto no encontrada")

        return profile.photo_path
