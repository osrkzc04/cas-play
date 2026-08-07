import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.modules.instructor_profiles.dependencies import require_instructor
from app.modules.instructor_profiles.schemas import (
    InstructorProfileResponse,
    InstructorProfileUpdate,
    InstructorPublicResponse,
)
from app.modules.instructor_profiles.service import InstructorProfileService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.storage import resolve_path


router = APIRouter(tags=["Instructor profiles"])


@router.get(
    "/instructor/profile",
    response_model=InstructorProfileResponse,
)
def get_own_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    service = InstructorProfileService(db)
    return service.get_or_create(current_user)


@router.put(
    "/instructor/profile",
    response_model=InstructorProfileResponse,
)
def update_own_profile(
    data: InstructorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    service = InstructorProfileService(db)
    return service.update_profile(current_user, data)


@router.put(
    "/instructor/profile/photo",
    response_model=InstructorProfileResponse,
)
def set_own_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    service = InstructorProfileService(db)
    return service.set_photo(current_user, file)


@router.delete(
    "/instructor/profile/photo",
    response_model=InstructorProfileResponse,
)
def delete_own_photo(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor),
):
    service = InstructorProfileService(db)
    return service.remove_photo(current_user)


@router.get(
    "/instructors/{user_id}/profile",
    response_model=InstructorPublicResponse,
)
def get_public_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    service = InstructorProfileService(db)
    return service.get_public(user_id)


@router.get(
    "/instructors/{user_id}/photo",
)
def get_public_photo(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> FileResponse:
    # Público: la etiqueta <img> no envía Authorization. La foto de perfil no es
    # contenido sensible (mismo criterio que la portada del curso).
    service = InstructorProfileService(db)
    photo_path = service.get_photo_path(user_id)
    return FileResponse(resolve_path(photo_path))
