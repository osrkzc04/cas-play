import uuid

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_optional_current_user
from app.modules.courses.dependencies import require_course_manager
from app.modules.materials.schemas import MaterialResponse
from app.modules.materials.service import MaterialService
from app.modules.users.models import User
from app.shared.dependencies import get_db
from app.shared.storage import resolve_path


router = APIRouter(
    tags=["Materials"],
)


@router.post(
    "/lessons/{lesson_id}/materials",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_material(
    lesson_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = MaterialService(db)
    return service.add_material(lesson_id, file, current_user)


@router.get(
    "/lessons/{lesson_id}/materials",
    response_model=list[MaterialResponse],
)
def list_materials(
    lesson_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    service = MaterialService(db)
    return service.list_materials(lesson_id, current_user)


@router.get(
    "/materials/{material_id}/download",
)
def download_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> FileResponse:
    service = MaterialService(db)
    material = service.get_material_for_download(material_id, current_user)
    return FileResponse(
        resolve_path(material.file_path),
        filename=material.original_name,
    )


@router.delete(
    "/materials/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_material(
    material_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_course_manager),
):
    service = MaterialService(db)
    service.delete_material(material_id, current_user)
