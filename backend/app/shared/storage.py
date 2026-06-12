import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import BadRequestException

_CHUNK_SIZE = 1024 * 1024


def _media_root() -> Path:
    root = Path(settings.MEDIA_ROOT)
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve_path(relative_path: str) -> Path:
    return _media_root() / relative_path


def save_upload(upload: UploadFile, subdir: str, max_bytes: int) -> str:
    """Guarda el archivo en streaming y devuelve su ruta relativa.

    El tamaño se valida mientras se escribe para no cargar el archivo
    completo en memoria. Si excede el límite, se descarta lo escrito.
    """
    extension = Path(upload.filename or "").suffix.lower()
    target_dir = _media_root() / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{extension}"
    target_path = target_dir / stored_name

    size = 0
    upload.file.seek(0)
    with target_path.open("wb") as buffer:
        while chunk := upload.file.read(_CHUNK_SIZE):
            size += len(chunk)
            if size > max_bytes:
                buffer.close()
                target_path.unlink(missing_ok=True)
                raise BadRequestException("El archivo excede el tamaño permitido")
            buffer.write(chunk)

    return str(Path(subdir) / stored_name)


def delete_file(relative_path: str | None) -> None:
    if not relative_path:
        return

    resolve_path(relative_path).unlink(missing_ok=True)
